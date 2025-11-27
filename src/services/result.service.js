const { assessment_attempts, attempt_results, assessments, Sequelize } = require('../db/models');
const { Op } = Sequelize;

// ----------------------------------------------------
// ALL STUDENT RESULTS (Optimized)
// ----------------------------------------------------
const getAllStudentResults = async (searchEmail = "",page = 1, pageSize = 10) => {

  const offset = (page - 1) * pageSize;
  const limit = pageSize ;
  const whereClause = {status :'completed'};
  if (searchEmail && searchEmail.trim() !== "") {
    whereClause.candidate_email = { [Op.iLike]: `%${searchEmail.trim()}%` };
  }
  const [countRows] = await assessment_attempts.sequelize.query(`
    SELECT COUNT(*) AS "totalStudents"
    FROM (
      SELECT candidate_email
      FROM assessment_attempts
      WHERE status ='completed'  
      ${searchEmail ? `AND candidate_email ILIKE '%${searchEmail.trim()}%'` : ""}
    ) AS distinct_students
  `);
  const totalStudents = Number(countRows[0]?.totalStudents || 0);

  const results = await attempt_results.findAll({
    attributes: [
      'id',
      'attempt_id',
      'score',
      'percentile',
      'pdf_url',
    ],
    include: [
      {
        model: assessment_attempts,
        as: "attempt",
        attributes: [
          'candidate_email',
          'candidate',
          'assessment',
          'testtaker_id'
        ],
        where: whereClause,
        include: [
          {
            model: assessments,
            as: "assessment_info",
            attributes: ['id', 'name', 'exam_id','main_career','sub_career']
          }
        ]
      }
    ],
    
    //group: ['candidate_email'],
    order: [['id', 'DESC']],
    limit,
    offset,
    subQuery: false,
    raw: true,
    logging: console.log,
  });

  return {
      totalRecords: totalStudents,
      totalPages: Math.ceil(totalStudents / pageSize),
      currentPage: page,
      data: results,
    };
};


// ----------------------------------------------------
// INDIVIDUAL STUDENT RESULT HISTORY (Optimized)
// ----------------------------------------------------
const getStudentExamDetails = async (email,page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const limit = pageSize ;

  const totalRecords = await assessment_attempts.count({
    where: { 
      candidate_email: email,
      status:'completed'
     }
  });

  const attempts = await assessment_attempts.findAll({
    where: {
      candidate_email: email,
      status:'completed'
    },
    attributes: [
      'id',
      'assessment',
      'candidate_email',
      'candidate',
      'started_at'
    ],
    include: [
      {
        model: attempt_results,
        as: "result_info",
        attributes: ['score', 'percentile', 'pdf_url']
      },
      {
        model: assessments,
        as: "assessment_info",
        attributes: ['id', 'name', 'exam_id','main_career','sub_career']
      }
    ],
    order: [['started_at', 'DESC']],
    limit,
    offset,
    raw: true,
    logging: console.log,
  });

  return {
    totalRecords,
    totalPages: Math.ceil(totalRecords / pageSize),
    currentPage: page,
    pageSize,
    data: attempts
  };
};

// ----------------------------------------------------
// Assessment List with Search and Pagination
// ----------------------------------------------------
const assessmentList = async (assessment = "", page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  const whereClause = {status :'active'};

  if (assessment && assessment.trim() !== "") {
    whereClause[Op.or] = [
      { main_career: { [Op.iLike]: `%${assessment.trim()}%` } },
      { sub_career: { [Op.iLike]: `%${assessment.trim()}%` } }
    ];
  }

  // *** Apply whereClause here ***
  const totalAssessments = await assessments.count({ where: whereClause });

  const results = await assessments.findAll({
    attributes: ['id', 'name', 'exam_id', 'main_career', 'sub_career'],
    where: whereClause,
    order: [['id', 'ASC']],
    limit,
    offset,
    raw: true,
  });

  return {
    totalRecords: totalAssessments,
    totalPages: Math.ceil(totalAssessments / pageSize),
    currentPage: page,
    data: results,
  };
};

module.exports = {
  getAllStudentResults,
  getStudentExamDetails,
  assessmentList
};
