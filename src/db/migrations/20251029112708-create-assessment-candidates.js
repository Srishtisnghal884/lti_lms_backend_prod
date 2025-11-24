'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assessment_candidates', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assessment: {
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      first_name: {
        type: Sequelize.STRING
      },
      last_name: {
        type: Sequelize.STRING
      },
      full_name: {
        type: Sequelize.STRING
      },
      invitation_uuid: {
        type: Sequelize.STRING
      },
      created: {
        type: Sequelize.DATE
      },
      testtaker_id: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      candidature_id: {           
        type: Sequelize.BIGINT,
        allowNull: false
      },
      is_deleted:{
        type: Sequelize.INTEGER,
        defaultValue:0
      },
      average: {
        type: Sequelize.FLOAT
      },
      is_with_feedback_about_hired: {
        type: Sequelize.BOOLEAN
      },
      reminder_sent: {
        type: Sequelize.BOOLEAN
      },
      last_reminder_sent: {
        type: Sequelize.DATE
      },
      content_type_name: {
        type: Sequelize.STRING
      },
      is_hired: {
        type: Sequelize.BOOLEAN
      },
      personality: {
        type: Sequelize.STRING
      },
      personality_algorithm: {
        type: Sequelize.STRING
      },
      greenhouse_profile_url: {
        type: Sequelize.STRING
      },
      stage: {
        type: Sequelize.STRING
      },
      status_notification: {
        type: Sequelize.STRING
      },
      average_with_weight: {
        type: Sequelize.FLOAT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assessment_candidates');
  }
};