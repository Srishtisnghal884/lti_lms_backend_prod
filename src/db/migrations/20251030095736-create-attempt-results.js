'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attempt_results', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      attempt_id: {
        type: Sequelize.BIGINT
      },
      score: {
        type: Sequelize.FLOAT
      },
      percentile: {
        type: Sequelize.STRING
      },
      result_json: {
        type: Sequelize.JSONB
      },
      pdf_url: {
        type: Sequelize.STRING
      },
      processed_at: {
        type: Sequelize.DATE
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
    await queryInterface.dropTable('attempt_results');
  }
};