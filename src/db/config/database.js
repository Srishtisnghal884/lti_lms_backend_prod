// This file exists because Sequelize only support import config as a string path, not an object
// module.exports = require('../../config/config').sqlDB;
module.exports = {
  development: require('../../config/config').sqlDB,
  test: require('../../config/config').sqlDB,
  production: require('../../config/config').sqlDB,
};