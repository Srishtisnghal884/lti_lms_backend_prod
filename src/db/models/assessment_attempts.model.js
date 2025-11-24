module.exports = (sequelize, DataTypes) => {
  const assessment_attempts = sequelize.define('assessment_attempts', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    assessment: {            // FK -> assessments.id
      type: DataTypes.BIGINT,
      allowNull: false
    },
    candidate: {             // FK -> assessment_candidates.id
      type: DataTypes.BIGINT,
      allowNull: false
    },
    candidate_email:{
      type: DataTypes.STRING,
      allowNull: false
    },  
    testtaker_id:{
      type: DataTypes.BIGINT,
      allowNull: true
    },
    attempt_number: {        // 1, 2, ... (client rule: 2nd is final)
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    status: {                // 'in_progress','submitted','processing','completed','failed'
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'in_progress'
    },
    external_attempt_id: {   // if TestGorilla gives a unique id for attempt (optional)
      type: DataTypes.BIGINT,
      allowNull: true
    },
    started_at: DataTypes.DATE,
    submitted_at: DataTypes.DATE,
    is_final: {              // true for candidate's "final" attempt per business rule
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    extra_info: DataTypes.JSONB
  }, {
    tableName: 'assessment_attempts',
    underscored: true,
  });
  
  assessment_attempts.associate = (models) => {
      // belongsTo assessment
      assessment_attempts.belongsTo(models.assessments, {
        foreignKey: 'assessment',
        targetKey: 'exam_id',
        as: 'assessment_info',
      });

      // belongsTo candidate
      assessment_attempts.belongsTo(models.assessment_candidates, {
        foreignKey: 'candidate_email',
        targetKey: 'email',
        as: 'candidate_info'
      });

      // hasOne attempt_result
      assessment_attempts.hasOne(models.attempt_results, {
        foreignKey: 'attempt_id',
        as: 'result_info',
      });
    };
  return assessment_attempts;
};
