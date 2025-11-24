const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const roleRoute = require('./role.route');
const docsRoute = require('./docs.route');
const testGorillaRoute = require('./testGorilla.route.js');
const adminRoute = require('./admin.route.js')
const router = express.Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/roles', roleRoute);
router.use('/assessments', testGorillaRoute);
router.use('/docs', docsRoute);
router.use('/admin', adminRoute);

module.exports = router;
