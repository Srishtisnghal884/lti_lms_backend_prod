const { assessment_attempts, assessments,assessment_candidates, Sequelize } = require('../db/models');
const db = require('../db/models');
const { Op } = Sequelize;

const getOverallStats = async () => {
  const [[studentCount]] = await db.assessment_attempts.sequelize.query(`
    SELECT COUNT(DISTINCT candidate_email) AS totalStudents
    FROM assessment_attempts
  `);
  const totalAssessments = await db.assessments.count();
  const totalAttempts = await db.assessment_attempts.count({
        where: {
          status: { [Op.eq]: 'completed' }
        },
      });
  return {
    totalStudents: Number(studentCount.totalstudents),
    totalAssessments,
    totalAttempts,
  };
};

const getAllStudentsWhoAttemptedExam = async (searchEmail = "",page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  const whereClause = {};
  if (searchEmail && searchEmail.trim() !== "") {
    whereClause.email = { [Op.iLike]: `%${searchEmail.trim()}%` };
  }
  const [countRows] = await db.assessment_candidates.sequelize.query(`
    SELECT COUNT(*) AS "totalStudents"
    FROM (
      SELECT DISTINCT email
      FROM assessment_candidates
      ${searchEmail ? `WHERE email ILIKE '%${searchEmail.trim()}%'` : ""}
    ) AS distinct_students
  `);
  const totalStudents = Number(countRows[0]?.totalStudents || 0);
  const students = await db.assessment_candidates.findAll({
      attributes: [
        'email',
        [Sequelize.fn('MIN', Sequelize.col('first_name')), 'first_name'],
        [Sequelize.fn('MIN', Sequelize.col('last_name')), 'last_name'],
        [Sequelize.fn('MIN', Sequelize.col('candidature_id')), 'candidature_id'],
        [Sequelize.fn('MIN', Sequelize.col('testtaker_id')), 'testtaker_id'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'attemptCount'],
      ],
      where: whereClause,
      group: ['email'],
      order: [['email', 'ASC']],
      limit,
      offset,
      subQuery: false,
      raw: true,
    });
    return {
      totalRecords: totalStudents,
      totalPages: Math.ceil(totalStudents / pageSize),
      currentPage: page,
      data: students,
    };
};

module.exports = {
  getOverallStats,
  getAllStudentsWhoAttemptedExam,
};
