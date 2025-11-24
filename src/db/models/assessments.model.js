module.exports = (sequelize, DataTypes) => {
  const assessments = sequelize.define('assessments', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
    },
    name: DataTypes.STRING,
    exam_id: DataTypes.BIGINT,
    job_role: DataTypes.INTEGER,
    work_arrangements: DataTypes.JSONB,
    locations: DataTypes.JSONB,
    public_links: DataTypes.JSONB,
    benchmark_name: DataTypes.STRING,
    invited: DataTypes.INTEGER,
    started: DataTypes.INTEGER,
    finished: DataTypes.INTEGER,
    status: DataTypes.STRING,
    modified: DataTypes.DATE,
    language: DataTypes.STRING,
    owner: DataTypes.INTEGER,
    extra_info: DataTypes.JSONB,
  }, {
    tableName: 'assessments',
    underscored: true,
  });

  assessments.associate = (models) => {
    // 1️⃣ assessments → candidates
    assessments.hasMany(models.assessment_candidates, {
      foreignKey: 'assessment_id',
      sourceKey: 'exam_id', 
      as: 'candidates',
    });

    // 2️⃣ assessments → attempts
    assessments.hasMany(models.assessment_attempts, {
      foreignKey: 'assessment',
      sourceKey: 'exam_id', 
      as: 'attempts',
    });
  };

  return assessments;
};
