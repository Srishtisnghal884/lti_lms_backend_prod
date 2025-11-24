'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('assessments', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        allowNull: false,
      },
      exam_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      job_role: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      work_arrangements: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      locations: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      public_links: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      benchmark_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      invited: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      started: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      finished: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      modified: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      language: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      owner: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      extra_info: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('assessments');
  },
};
