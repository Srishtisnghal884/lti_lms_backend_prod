const cloudinary = require('cloudinary').v2;
const fs = require("fs");
const path = require("path");
const httpStatus = require('http-status');
const testGorillaClient = require('../config/testGorillaClient'); 
const ApiError = require('../utils/ApiError');
const db = require('../db/models');
const { Op } = require('sequelize');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all assisment from test gorilla
async function getAllAssessments(req) {
  const {status} = req.query;
  const res = await testGorillaClient.get(`/assessments/?status=${status}`);
  return res.data;
}
/**
 * 
 * @param {*} req 
 * get Assessments Details for each assument
 * @returns 
 */
async function getAssessmentsDetails(req) {
  const {ASSESSMENT_ID} = req.params;
  const res = await testGorillaClient.get(`/assessments/${ASSESSMENT_ID}`);
  return res.data;
}
/**
 * @param {*} req 
 * Before invite for the exam need to check its already been test given for the candidate and how many time he did it
 * now are allowing only two time per candidate per test.
 * @returns 
 */
async function checkCandidateEligibility(req) {

  try{
    const {email, assessment} = req.body;
    /**
     * 1. Get assessment ID from DB using assessment name
     * 2. Check if candidate with email has taken the test
     * 3. If taken less than 2 times, return true else throw error
     */
    const {id, exam_id: ASSESSMENT_ID} = await getAssessmentByName(assessment);
    // console.log("Fetched assessment ID:", ASSESSMENT_ID);

    if (!ASSESSMENT_ID) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }
    
    // Check how many times the candidate has taken the test
    const attempts = await db.assessment_attempts.count({
      where: {
        candidate_email: { [Op.iLike]: email },
        assessment: ASSESSMENT_ID,
        status: { [Op.ne]: 'invited' } // Exclude failed attempts
      },
      // returning:true,
      // logging:console.log
    });
    console.log(`Candidate ${email} has taken assessment ${ASSESSMENT_ID} ${attempts} times.`);
    const resultData = await getAssessmentPreviousResults(email,ASSESSMENT_ID);
    let previousResultData = [{}];
    if(resultData){
      previousResultData = resultData.data;
    }
    console.log({previousResultData});
  //  console.log({'adss':result.data});
    if (attempts >= 2) {
      return {
        status: httpStatus.FORBIDDEN,
        message: 'Candidate has already taken the test twice',
        data: {
          attempts,previousResultData
        }
      };
    }
    

    /*else{
         // console.log('test',{email},{ASSESSMENT_ID});
         const attemptDetails = await db.assessment_attempts.findOne({
            where: {
              candidate_email: email,
              assessment: ASSESSMENT_ID,
              status: { [Op.eq]: 'completed' } // Exclude failed attempts
            },
            // returning:true,
            // logging:console.log
          });
          // console.log({attemptDetails});
          // Check attempt details already exist
          if(attemptDetails){
            // console.log({attemptDetails});
            const candidatureId = attemptDetails?.candidate;
            // Here we are implement the delete old user account associated with testGorilla and create new one in db as well
            const deleteCandidature = await testGorillaClient.delete(
                  `/assessments/candidature/${candidatureId}`
              );
              console.log('===========>',deleteCandidature);
              if(!deleteCandidature){
                throw new ApiError(httpStatus.CONFLICT, 'Candidate Already been deleted from testgorilla');
              }
            // Update the assessment_candidates user record deleted
            const existingCandidate = await db.assessment_candidates.update(
              { is_deleted : 1 },
              {
                where: { 
                  email: req.body.email,
                  assessment_id: ASSESSMENT_ID,
                  is_deleted:{ [Op.eq]: 0 }
                },
                raw: true,  
                logging: console.log,
              });
          }
    }*/

    return {
      status: httpStatus.OK,
      message: 'Candidate is eligible to take the test',
      data: {
        attempts,previousResultData
      }
    };
  }catch(err){
    console.error('TestGorilla check_candidate failed:');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    console.error("Error checking candidate eligibility:", err.message);
    throw new ApiError(
      err.response?.status,
      JSON.stringify(err.response?.data, null, 2) ?JSON.stringify(err.response?.data, null, 2): err.message,
    );
  }

 
}

async function invite_candidate(req) {
  const t = await db.sequelize.transaction();
  const {assessment: ASSESSMENT_NAME} = req.body;
  delete req.body.assessment;
  // Make the API
  try{
    const {id, exam_id: ASSESSMENT_ID} = await getAssessmentByName(ASSESSMENT_NAME);
    // Check if candidate already exists before inviting
    const existingCandidate = await db.assessment_candidates.findOne({
      where: { 
        email: { [Op.iLike]: req.body.email },
        assessment_id: ASSESSMENT_ID,
        is_deleted:{ [Op.eq]: 0 }
      },
      transaction: t,
      raw: true,  
      logging: console.log,
    });
    
    if (existingCandidate) {
          await t.rollback();
          return {
            status: httpStatus.OK,
            message: 'This candidate has already been invited to this assessment',
            data: {
              id: existingCandidate.id,
              inviteUrl: `${process.env.TG_INVITE_URL}${existingCandidate.invitation_uuid}`
            }
          };
     }
    const response  = await testGorillaClient.post(
      `/assessments/${ASSESSMENT_ID}/invite_candidate/?no_email=true`, 
      req.body
    );
    const newAssessment = response?.data || response;
     
    if (!newAssessment) {
      throw new Error("Failed to invite candidate");
    }
    // store candidate details in DB
    await createAssessmentCandidates(id, newAssessment, t);
    // store attempt details in DB
    await createAssessmentAttempts(newAssessment, t);
    await t.commit(); // <--- ACID SUCCESS
    const {invitation_uuid} = newAssessment;
    return {
        status: httpStatus.CREATED,
        message: 'This candidate has been invited to this assessment',
        data: {
          inviteUrl: `${process.env.TG_INVITE_URL}${invitation_uuid}`
        }
      };
    //return newAssessment.data;
  }catch(err){
      console.error('TestGorilla invite_candidate failed:');
      console.error('Status:', err.response?.status);
      console.error('Data:', JSON.stringify(err.response?.data, null, 2));
      console.error('Message:', err.message);
      throw new ApiError(
         err.response?.status || httpStatus.INTERNAL_SERVER_ERROR,
        err.response?.data ? JSON.stringify(err.response.data, null, 2) : err.message
        );
  }
}

/**
 * @param {} name 
 * Get the assisment details based on the testGorilla code
 * @returns 
 */
async function getAssessmentByName(name) {
    const assessment = await db.assessments.findOne({
      where: {
        name:{
          [Op.eq]: name
        },
        status: 'active'
      },
      attributes: ['id', 'name', 'exam_id','main_career','sub_career'],
      raw: true,
      logging: console.log, // 👈 This prints the raw SQL
    });
    if (!assessment) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }
    return assessment;
}
/**
 * @param {*} id 
 * @param {*} data 
 * Store the candidate details for the Assessment 
 * @returns 
 */

async function createAssessmentCandidates(id,data,transaction) {
  const {
    id:candidature_id,
    assessment:assessment_id,
    testtaker_id,
    email,
    first_name,
    last_name,
    full_name,
    invitation_uuid,
    average,
    status,
    content_type_name,
    is_hired,
    stage,
    status_notification,
    average_with_weight
  } = data;

  // Check existing by testtaker_id or by email + assessment_id as fallback
  const candidate = await db.assessment_candidates.findOne({
    where: { testtaker_id,is_deleted:{ [Op.eq]: 0 },email, assessment_id: assessment_id },transaction
  });

  if (candidate) {
    throw new ApiError(httpStatus.CONFLICT, 'This candidate has already been invited to this assessment in create function');
  }

  const payload = {
    candidature_id,
    assessment_id,
    testtaker_id,
    email,
    first_name,
    last_name,
    full_name,
    invitation_uuid,
    average,
    status,
    content_type_name,
    is_hired,
    stage,
    status_notification,
    average_with_weight
  };

  // remove undefined values so DB defaults apply
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  const created = await db.assessment_candidates.create(
    payload,
    {
      returning: true,
      logging: console.log,
    },
    {transaction}
  );
  return created.get ? created.get({ plain: true }) : created;
}
/**
 * @param {*} id 
 * @param {*} data 
 * Create assessment attempt record in DB while inviting candidate
 * @returns 
 */

async function createAssessmentAttempts(data, transaction) {
  const { 
    id,
    assessment,
    attempt_number,
    status,
    created,
    is_final,
    email,
    testtaker_id
  } = data;

  const payload = {
    candidate:id,
    assessment,
    attempt_number, 
    status,
    started_at: created,
    is_final,
    candidate_email: email,
    testtaker_id
  };
  console.log({'attempts--->':payload})
  // remove undefined values so DB defaults apply
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });
  const createdRecords = await db.assessment_attempts.create(
    payload,
    {
      returning: true,
      logging: console.log,
    },
    { transaction }
  );
  return createdRecords.get ? createdRecords.get({ plain: true }) : createdRecords;
}

/**
 * Fetch the assessment details for uses in other modules
 */

async function fetchAssessmentDetailsResult(req) {
  const t = await db.sequelize.transaction();
  try{
    const {email, assessment} = req.body;
    /**
     * 1. Get assessment ID from DB using assessment name
     * 2. Check if candidate with email has taken the test
     * 3. Get the test result pdf and store in server
     */
    const {exam_id: ASSESSMENT_ID} = await getAssessmentByName(assessment);
    const isLocal = process.env.VERCEL_ENV !== 'production';
    let baseUrl = process.env.BASE_URL || "http://localhost:3000/"; // replace with your domain
    if (!ASSESSMENT_ID) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
    }
    // Check how many times the candidate has taken the test
    const attempts = await db.assessment_attempts.findOne({
      where: {
        candidate_email: { [Op.iLike]: email },
        assessment: ASSESSMENT_ID,
        status: { [Op.eq]: 'completed' } // Exclude failed attempts
      },
      include:[
        {
          model: db.assessments,
          as: 'assessment_info',
          attributes: ['id', 'name', 'exam_id','main_career','sub_career'],
        },
      ],
      order:[['id','DESC']],
      transaction: t
      // returning:true,
      // logging:console.log
    });
    
    if(!attempts){
      throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not completed yet');
    }
    let candidature = attempts ? attempts.candidate : null;
    let testtaker_id = attempts ? attempts.testtaker_id : null;
    let attempt_id = attempts ? attempts.id : null;
    let extraInfo = attempts ? JSON.parse(attempts.extra_info):{};
    let assessment_info = attempts?.assessment_info?.get({ plain: true }) || {};

    let CLOUDINARY_PUBLIC_URL = isLocal ? baseUrl : process.env.CLOUDINARY_PUBLIC_URL || 'https://res.cloudinary.com/dzxykkivk/raw/upload/v1762752063/testgorilla_reports/';
     // Check exam result already attempt to get from attempt_results start here
    
    const existing = await db.attempt_results.findOne({
        where: {
          attempt_id:attempt_id
        },
        transaction: t
      });
      console.log({"assessment_info===>":assessment_info});
      console.log({"main_career":assessment_info?.main_career})
      console.log({"sub_career":assessment_info?.sub_career})
      if (existing) {
         await t.commit();
         const pdf_url = existing?.pdf_url || '';
         return {
          status: httpStatus.OK,
          message: "PDF get successfully",
          data: {
            email,
            assessment,
            file_path: `${CLOUDINARY_PUBLIC_URL}${pdf_url}`,
            score:existing?.score,
            percentile:existing?.percentile,
            main_career:assessment_info?.main_career || '',
            sub_career:assessment_info?.sub_career || ''
          },
        };
        console.log({'result found---->':existing});
      } 

    // end here

    /**GET PDF of result  Start*/
    const pdfUrl = `/assessments/candidates/${testtaker_id}/render_pdf/?candidature=${candidature}`;
    const response = await testGorillaClient.get(pdfUrl, {
      responseType: "arraybuffer", // Important for PDF files
    });

  // Get the project root directory
   
   
    let fileName = `candidate_${email}_${candidature}_${testtaker_id}.pdf`;
    let publicUrl = `${baseUrl}/public/testgorilla_reports/${fileName}`;

    if(isLocal){
      const rootDir = path.resolve(__dirname, "../../");
      const pdfDir = path.join(rootDir, "/public/testgorilla_reports");
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      const pdfPath = path.join(pdfDir, `candidate_${email}_${candidature}_${testtaker_id}.pdf`);
      // Save file to server
      fs.writeFileSync(pdfPath, response.data);
      fileName  = `candidate_${email}_${candidature}_${testtaker_id}.pdf`;
      publicUrl = `${baseUrl}/public/testgorilla_reports/${fileName}`;
    }else{
        const tempPath = `/tmp/${fileName}`;
        fs.writeFileSync(tempPath, response.data);
        try {
          const uploadRes = await cloudinary.uploader.upload(tempPath, {
            resource_type: "raw", // Required for non-image files like PDFs
            folder: "testgorilla_reports",
            public_id: fileName.replace(".pdf", ""),
            overwrite: true,
          });
          publicUrl = uploadRes.secure_url;
          console.log("✅ Uploaded to Cloudinary:", publicUrl);
          // optional cleanup
          fs.unlinkSync(tempPath);
        } catch (err) {
          console.error("❌ Cloudinary upload failed:", err.message);
          throw err;
      }
    }
    /**GET PDF of result  End*/

    /**
     * Store JSON result in DB
     */
    const jsonUrl = `/assessments/results/?candidature__assessment=${ASSESSMENT_ID}&candidature__test_taker=${testtaker_id}`;  
    const jsonResult = await testGorillaClient.get(jsonUrl);   
    let rawScore = 0;
    let percentile = 0;
    const results = jsonResult.data?.results || [];
    /*let scoreDetails = await Promise.all(
      results.map(async (test) => {
          rawScore = `${test.raw_score}%`;
          percentile = `${test.display_normalized_percentile_score}th`;
          console.log(`${test.name}: Raw Score ${rawScore}, Percentile ${percentile}`);
          return { rawScore, percentile };
        })
    );  */

    rawScore = extraInfo?.average_score || 0 
    percentile = extraInfo?.normalized_weighted_percentile_score || 0
   
    // Create DB with file path
    const data = {
      attempt_id: attempt_id ? attempt_id : null,
      score:rawScore,
      percentile : percentile,
      result_json: JSON.stringify(jsonResult?.data?.results || {}),
      pdf_url: fileName,
    };
    console.log({data});
    await createAssessmentResults(data,t);
    await t.commit();

    return {
      status: httpStatus.OK,
      message: "PDF downloaded and stored successfully",
      data: {
        email,
        assessment,
        file_path: publicUrl,
        score:rawScore,
        percentile:percentile
      },
    };
  }catch(err){
    console.error('TestGorilla Fetch Result failed:');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    console.error("Error checking candidate result:", err.message);
    throw new ApiError(
      httpStatus.OK,
      err.message
    );
  }


}

async function createAssessmentResults(data, t) {
  const {
    attempt_id,
    score,
    percentile,
    result_json,
    pdf_url
  } = data;

  const payload = {
    attempt_id,
    score,
    percentile,
    result_json,
    pdf_url
  };

  // remove undefined
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  const [record, created] = await db.attempt_results.upsert(
    payload,
    { transaction: t },
    {
      returning: true,
      logging: console.log
    }
  );

  // record will contain updated or created row
  return record.get ? record.get({ plain: true }) : record;
}

/**
 * this will check exam status for the candidate its done or not and send them information
 */

async function checkExamStatus(req){
  try{
    const {email,assessment} = req.body;
    console.log({email},{assessment});
    const {exam_id: ASSESSMENT_ID} = await getAssessmentByName(assessment);
    const {assessment_id,email:candidate_email,testtaker_id,candidature_id} =  await  getCandidateDetailsByAssessment(email,ASSESSMENT_ID);
    console.log(`/assessments/candidates=${testtaker_id}`,`${candidature_id}`);
    const res = await testGorillaClient.get(`/assessments/candidates/${testtaker_id}`);
    let matchedExamRecords = res.data?.assessments_detail.filter((r) => r.id == candidature_id)
    const [assessmentRecords = {}] = matchedExamRecords;

    console.log('==========>',assessmentRecords);
    let res_assessment_id = assessmentRecords?.assessment_id;
    let res_candidature_id = assessmentRecords?.candidature_id;
    let res_status = assessmentRecords?.status;
    let normalized_weighted_percentile_score = assessmentRecords?.display_normalized_weighted_percentile_score;
    let average_score = assessmentRecords?.average_score;
    let extraInfo = JSON.stringify({
      normalized_weighted_percentile_score:normalized_weighted_percentile_score,
      average_score:average_score
    })
    if(res.data){
      // Here update the candidate attempts status 
       const updateAssessmentAttempts = await db.assessment_attempts.update(
        { 
          status : res_status,
          extra_info : extraInfo
        },
        {
          where: { 
            candidate_email: { [Op.iLike]: email },
            assessment: ASSESSMENT_ID,
            testtaker_id:testtaker_id,
            candidate : candidature_id,
            status:{ [Op.in]: ['invited', 'started'] }
          },
          raw: true,  
          logging: console.log,
        });
      console.log({ASSESSMENT_ID},{testtaker_id},{candidature_id});
      // console.log(res.data);
      return {
        status: httpStatus.OK,
        message: "Fetched Candidate data successfully",
        data: assessmentRecords,
      };
    }
    
  }catch(err){
      console.error('TestGorilla candidate Exam status:');
      console.error('Status:', err.response?.status);
      console.error('Data:', JSON.stringify(err.response?.data, null, 2));
      console.error("Error checking candidate Exam status:", err.message);
      throw new ApiError(
        httpStatus.OK,
        err.message
      );
  }
}

async function getCandidateDetails(email){
  const candiateDetails = await db.assessment_candidates.findOne({
      where: {
        email:{
          [Op.iLike]: email
        },
        is_deleted:{ [Op.eq]: 0 }
      },
      order:[['id','DESC']],
      attributes: ['assessment_id', 'email', 'testtaker_id','candidature_id'],
      raw: true,
     //  logging: console.log, // 👈 This prints the raw SQL
    });
    if (!candiateDetails) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
    }
    return candiateDetails;
}

async function getCandidateDetailsByAssessment(email,assessment_id){
  const candiateDetails = await db.assessment_candidates.findOne({
      where: {
        email:{
          [Op.iLike]: email
        },
        assessment_id:assessment_id,
        is_deleted:{ [Op.eq]: 0 }
      },
      order:[['id','DESC']],
      attributes: ['assessment_id', 'email', 'testtaker_id','candidature_id'],
      raw: true,
     //  logging: console.log, // 👈 This prints the raw SQL
    });
    if (!candiateDetails) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
    }
    return candiateDetails;
}

async function deleteCandidateTestGorilla(req){
    try{
      const {email, assessment} = req.body;
      const {id, exam_id: ASSESSMENT_ID} = await getAssessmentByName(assessment);
      if (!ASSESSMENT_ID) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Assessment not found');
      }
      // console.log('test',{email},{ASSESSMENT_ID});
      const attemptDetails = await db.assessment_attempts.findOne({
        where: {
          candidate_email: { [Op.iLike]: email },
          assessment: ASSESSMENT_ID,
          status: { [Op.eq]: 'completed' } // Exclude failed attempts
        },
        order:[['id','DESC']]
        // returning:true,
        // logging:console.log
      });
      // console.log({attemptDetails});
      // Check attempt details already exist
      if(attemptDetails){
        const candidatureId = attemptDetails?.candidate;
        // Here we are implement the delete old user account associated with testGorilla and create new one in db as well
        const deleteCandidature = await testGorillaClient.delete(
              `/assessments/candidature/${candidatureId}`
          );
        if(!deleteCandidature){
          throw new ApiError(httpStatus.CONFLICT, 'Candidate Already been deleted from testgorilla');
        }
        // Update the assessment_candidates user record deleted
        const existingCandidate = await db.assessment_candidates.update(
          { is_deleted : 1 },
          {
            where: { 
              email: { [Op.iLike]: req.body.email },
              assessment_id: ASSESSMENT_ID,
              is_deleted:{ [Op.eq]: 0 }
            },
            raw: true,  
            logging: console.log,
          });
      }

      return {
        status: httpStatus.OK,
        message: 'Candidate is Deleted',
      };
  }catch(err){
    console.error('TestGorilla delete_candidate failed:');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
    console.error("Error checking candidate eligibility:", err.message);
    throw new ApiError(
      err.response?.status,
      JSON.stringify(err.response?.data, null, 2) ?JSON.stringify(err.response?.data, null, 2): err.message,
    );
  }
}

/**
 * Upload a PDF file to Cloudinary
 * @param {string} filePath - Full local path to the PDF file
 * @param {string} fileName - Desired name in Cloudinary
 * @returns {Promise<string>} - Returns the Cloudinary public URL
 */
async function uploadPdfToCloudinary(filePath, fileName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "raw", // Needed for PDFs, ZIPs, etc.
      folder: "testgorilla_reports", // Cloudinary folder
      public_id: fileName.replace(".pdf", ""), // File name without extension
      overwrite: true, // Replace if exists
    });

    console.log("✅ Uploaded to Cloudinary:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    throw error;
  }
}

async function getCandidateResults(email, page = 1, pageSize = 10) {

  console.log({email})
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const results = await db.assessment_attempts.findAndCountAll({
    where: {
      candidate_email: { [Op.iLike]: email }, // case-insensitive email
      status: 'completed',
    },
    include: [
      {
        model: db.assessments,
        as: 'assessment_info',
        attributes: ['id', 'name', 'exam_id','main_career','sub_career'],
      },
      {
        model: db.attempt_results,
        as: 'result_info',
        attributes: ['score', 'percentile', 'pdf_url'],
      },
    ],
    order: [['id', 'DESC']], // latest first
    distinct: true,
    limit,
    offset,
    subQuery: false ,
    raw: true,
    logging: console.log,
  });

  return {
    totalRecords: results.count,
    totalPages: Math.ceil(results.count / pageSize),
    currentPage: page,
    data: results.rows,
  };
}

async function checkCandidatePendingInvitation(email){
    try {
      const assessmentAttempts = await db.assessment_attempts.findAll(
        {
          where: { 
            candidate_email: { [Op.iLike]: email },
            status:{ [Op.in]: ['invited', 'started'] }
          },
          raw: true,  
          logging: console.log,
        });

        if (!assessmentAttempts.length) {
          return { status: httpStatus.OK, message: 'No candidate found' };
        }
        
        const deleteResults  = await Promise.all(
          assessmentAttempts.map( async(as) => {
              const {candidate, candidate_email, assessment} = as;
              try{
                await testGorillaClient.delete(`/assessments/candidature/${candidate}`);
              }catch(err){
                if (err.response?.status === 404) {
                  console.warn(`⚠️ Candidate ${candidate} not found in TestGorilla`);
                } else {
                  console.error(`❌ Error deleting ${candidate}:`, err.message);
                  throw err; // rethrow other errors
                }
              }

                // Mark as deleted in DB
                await db.assessment_candidates.update(
                  { is_deleted: 1 },
                  {
                    where: {
                      email: { [Op.iLike]: candidate_email },
                      assessment_id: assessment,
                    },
                  }
                );

                return candidate;
              })
        );
      console.log({deleteResults});
      return {
        status: httpStatus.OK,
        message: 'Candidate(s) deleted successfully',
        deleted: deleteResults.length,
      };
    }catch(err){
      console.error('❌ Error in deletion:', err.message);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }

}

// get result score for previous exam
async function getAssessmentPreviousResults(email,ASSESSMENT_ID){

  //  where: {
  //       candidate_email: { [Op.iLike]: email },
  //       assessment: ASSESSMENT_ID,
  //       status: { [Op.ne]: 'invited' } // Exclude failed attempts
  //     }
  console.log({email})
  const results = await db.assessment_attempts.findAndCountAll({
    where: {
      candidate_email: { [Op.iLike]: email }, // case-insensitive email
      status: 'completed',
      assessment:ASSESSMENT_ID
    },
    include: [
      {
        model: db.assessments,
        as: 'assessment_info',
        attributes: ['id', 'name', 'exam_id','main_career','sub_career'],
      },
      {
        model: db.attempt_results,
        as: 'result_info',
        attributes: ['score', 'percentile', 'pdf_url'],
      },
    ],
    order: [['id', 'DESC']], // latest first
    distinct: true,
    raw: true,
    logging: console.log,
  });

  return {
    data: results.rows,
  };
}

module.exports = {
  getAllAssessments,
  getAssessmentsDetails,
  invite_candidate,
  checkCandidateEligibility,
  fetchAssessmentDetailsResult,
  checkExamStatus,
  deleteCandidateTestGorilla,
  getCandidateResults,
  checkCandidatePendingInvitation
};
