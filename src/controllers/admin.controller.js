const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {
  authService,
  userService,
  emailService,
  tokenService,
  statisticsService,
  resultService,
} = require('../services');
const { verifyToken } = require('../utils/auth');
// ---------------------------------------------------------
// 1. STATICS → Total students, total assessments, etc.
// ---------------------------------------------------------
const statics = catchAsync(async (req, res) => {
  // Get statistics (total candidates, total assessments, etc.)
  const stats = await statisticsService.getOverallStats();
	res.json({
    success: true,
    message: "Dashboard statistics fetched successfully",
    data: stats,
  })
});


// ---------------------------------------------------------
// 2. STUDENT LIST → All students who attended at least 1 exam
// ---------------------------------------------------------
const studentList = catchAsync(async (req, res) => {
	const {page,pageSize} = req.params;
	const {searchEmail} = req.query;
	const students = await statisticsService.getAllStudentsWhoAttemptedExam(searchEmail,page,pageSize);
	res.json(students)
});


// ---------------------------------------------------------
// 3. STUDENT RESULT LIST → List of all student results
// ---------------------------------------------------------
const studentResultList = catchAsync(async (req, res) => {
	const {page,pageSize} = req.params;
	const {searchEmail} = req.query;
  const results = await resultService.getAllStudentResults(searchEmail,page,pageSize);
	res.json(results)
});


// ---------------------------------------------------------
// 4. STUDENT DETAILS RESULT LIST → Exams given by a single student
// ---------------------------------------------------------
const studentDetailsResultList = catchAsync(async (req, res) => {
  const { searchEmail } = req.query; // e.g. /student-results/:studentId
  const {page,pageSize} = req.params;
  const examDetails = await resultService.getStudentExamDetails(searchEmail,page,pageSize);
  res.json(examDetails)
});

const uploadLogo  = catchAsync(async(req,res) => {
  const header = req.headers;
  const token = header.authorization.split(" ")[1];
  const userData  = await verifyToken(token);
  const userId = userData.userId;

  
  if (!req.file) {
    return res.status(400).json({
      status: "fail",
      message: "No file uploaded",
    });
  }
 
  const data = {logo: req.file.path,userId:userId}
  const updateStatus = await userService.updateLogo(data);
  console.log({updateStatus});
  return res.status(200).json({
    status: "success",
    message: "Logo uploaded successfully",
    url: req.file.path,        // Cloudinary URL
    public_id: req.file.filename
  });
})

const getLogo = catchAsync(async(req,res) => {
  const getLogo = await userService.getUserLogoByEmail('admin@gmail.com');
  const user = {
    logo:getLogo?.logo || 'https://employabilityadvantage.com/wp-content/uploads/2023/01/ECA-coloured-logo.svg'
  }
  res.send({ success: true, data: user });
});

// ---------------------------------------------------------
// 3. Assessment LIST → All Assessment List
// ---------------------------------------------------------
const assessmentList = catchAsync(async (req, res) => {
	const {page,pageSize} = req.params;
	const {assessment} = req.query;
	const students = await resultService.assessmentList(assessment,page,pageSize);
	res.json(students)
});


// EXPORT
module.exports = {
  statics,
  studentList,
  studentResultList,
  studentDetailsResultList,
  uploadLogo,
  getLogo,
  assessmentList
};
