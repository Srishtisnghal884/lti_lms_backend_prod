'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('assessments', [
      {
        exam_id: 329173,
        name: "EA_Marketing Management_May2022",
        job_role: null,
        work_arrangements: null,
        locations: null,
        public_links: null,
        benchmark_name: null,
        invited: 5,
        started: 0,
        finished: 14,
        status: "active",
        modified: "2024-10-07T19:13:39.427948Z",
        language: "en",
        owner: null,
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 19,
          finished_percentage: 73,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 343621,
        name: "EA_Marketing_Digital_SocialMedia_June2022",
        job_role: null,
        work_arrangements: null,
        locations: null,
        public_links: null,
        benchmark_name: null,
        invited: 8,
        started: 11,
        finished: 31,
        status: "active",
        modified: "2024-10-07T19:16:46.564507Z",
        language: "en",
        owner: null,
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 50,
          finished_percentage: 62,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 343622,
        name: "EA_Accounting_BusinessManagementFinance_June22",
        invited: 13,
        started: 11,
        finished: 13,
        status: "active",
        modified: "2024-10-07T19:16:46.600965Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 37,
          finished_percentage: 35,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 343623,
        name: "EA_IT_Business Analyst_June22",
        invited: 29,
        started: 27,
        finished: 209,
        status: "active",
        modified: "2024-10-07T19:16:46.639641Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 265,
          finished_percentage: 78,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 343624,
        name: "EA_HR_Learning&Development_June22",
        invited: 9,
        started: 0,
        finished: 16,
        status: "active",
        modified: "2024-10-07T19:16:46.706208Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 25,
          finished_percentage: 64,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 343641,
        name: "EA_IT_NetworkAdmin_CloudComp_Cybersecurity_June2022",
        invited: 35,
        started: 32,
        finished: 258,
        status: "active",
        modified: "2024-10-07T19:16:46.812595Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 325,
          finished_percentage: 79,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 1432951,
        name: "Data test test",
        invited: 1,
        started: 1,
        finished: 0,
        status: "active",
        modified: "2025-08-28T07:37:51.182992Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 2,
          finished_percentage: 0,
          pricing_state: "allowed"
        }),
      },
      {
        exam_id: 1460509,
        name: "Node.js Developer - Worldwide - Remote",
        invited: 1,
        started: 0,
        finished: 0,
        status: "active",
        modified: "2025-10-22T10:14:14.551274Z",
        language: "en",
        extra_info: JSON.stringify({
          first_external_candidate_invited: true,
          candidates: 1,
          finished_percentage: 0,
          pricing_state: "allowed"
        }),
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('assessments', null, {});
  }
};
