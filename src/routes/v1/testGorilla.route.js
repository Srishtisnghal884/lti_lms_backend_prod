const express = require('express');
const { testGorillaController } = require('../../controllers');
const router = express.Router();
router.get("/assessments", testGorillaController.getAllAssessments);
router.get("/assessmentsDetails/:ASSESSMENT_ID", testGorillaController.assessmentsDetails);
router.post("/invite_candidate", testGorillaController.invite_candidate);
router.post("/checkCandidateEligibility", testGorillaController.checkCandidateEligibility);
router.post("/fetchAssessmentDetailsResult", testGorillaController.fetchAssessmentDetailsResult);
router.post("/checkExam", testGorillaController.checkExamStatus);
router.post("/checkCandidate", testGorillaController.deleteCandidateTestGorilla);
router.get("/getResult/:email/:page/:pageSize", testGorillaController.getCandidateResults);
router.get("/checkCandidateInvitation/:email", testGorillaController.checkCandidatePendingInvitation);


module.exports = router;
