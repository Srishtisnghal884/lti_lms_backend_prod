'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assessment_attempts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assessment: {
        type: Sequelize.BIGINT
      },
      candidate: {
        type: Sequelize.BIGINT
      },
      testtaker_id: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      candidate_email:{
        type: Sequelize.STRING,
        allowNull: false
      }, 
      attempt_number: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING
      },
      external_attempt_id: {
        type: Sequelize.BIGINT
      },
      started_at: {
        type: Sequelize.DATE
      },
      submitted_at: {
        type: Sequelize.DATE
      },
      is_final: {
        type: Sequelize.BOOLEAN
      },
      extra_info: {
        type: Sequelize.JSONB
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
    await queryInterface.dropTable('assessment_attempts');
  }
};