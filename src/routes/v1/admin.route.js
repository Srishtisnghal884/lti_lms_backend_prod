const express = require('express');
const validate = require('../../middlewares/validate');
const {imageUploadValidator}  = require('../../middlewares/validateImage')
const authValidation = require('../../validations/auth.validation');
const adminController = require('../../controllers/admin.controller');
const upload = require("../../config/multer");
const router = express.Router();

// admin dashboard setting
router.get('/statics', adminController.statics);
router.get('/student-list/:searchEmail?/:page/:pageSize', adminController.studentList);
router.get('/studentResultList/:searchEmail?/:page/:pageSize', adminController.studentResultList);
router.get('/studentDetailsResultList/:searchEmail?/:page/:pageSize', adminController.studentDetailsResultList);
router.post('/upload-logo',upload.single("logo"),imageUploadValidator, adminController.uploadLogo);
router.get('/get-logo', adminController.getLogo);
router.get('/assessment-list/:assessment?/:page/:pageSize', adminController.assessmentList);

module.exports = router;