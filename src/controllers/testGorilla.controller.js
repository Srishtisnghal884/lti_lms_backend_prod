const { testGorillaService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const getAllAssessments = catchAsync(async (req, res) => {
    const tests = await testGorillaService.getAllAssessments(req);
    res.json(tests);
});

const assessmentsDetails = catchAsync(async (req, res) => {
    const details = await testGorillaService.getAssessmentsDetails(req);
    res.json(details);
});

const checkCandidateEligibility = catchAsync(async (req, res, next) => {
    const checkCandidateEligibility = await testGorillaService.checkCandidateEligibility(req);
    res.json(checkCandidateEligibility);
});

const invite_candidate = catchAsync(async (req, res) => {
    const newAssessment = await testGorillaService.invite_candidate(req);
    res.status(201).json(newAssessment);
});

const fetchAssessmentDetailsResult = catchAsync(async (req, res) => {
    const details = await testGorillaService.fetchAssessmentDetailsResult(req);
    res.json(details);
});

const checkExamStatus = catchAsync(async(req,res) => {
    const examStatus = await testGorillaService.checkExamStatus(req);
    res.json(examStatus);
})

const deleteCandidateTestGorilla =catchAsync (async(req,res) => {
    const examStatus = await testGorillaService.deleteCandidateTestGorilla(req);
    res.json(examStatus);
})

const getCandidateResults =catchAsync (async(req,res) => {
    const {email,page,pageSize} = req.params;
    const examStatus = await testGorillaService.getCandidateResults(email,page,pageSize);
    res.json(examStatus);
})

const checkCandidatePendingInvitation = catchAsync(async(req,res) => {
    const {email} = req.params;
    const examStatus = await testGorillaService.checkCandidatePendingInvitation(email);
    res.json(examStatus);
})

module.exports = {
  getAllAssessments,
  assessmentsDetails,
  invite_candidate,
  checkCandidateEligibility,
  fetchAssessmentDetailsResult,
  checkExamStatus,
  deleteCandidateTestGorilla,
  getCandidateResults,
  checkCandidatePendingInvitation
};
