const { INTEGER } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const assessment_candidates = sequelize.define('assessment_candidates', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    assessment_id: {          // ✅ FK -> assessments.id
      type: DataTypes.BIGINT,
      allowNull: false
    },
    // candidate_id: {           // ✅ FK -> candidates.id
    //   type: DataTypes.BIGINT,
    //   allowNull: false
    // },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    full_name: DataTypes.STRING,
    invitation_uuid: {
      type: DataTypes.UUID,
      allowNull: false,         
      defaultValue: DataTypes.UUIDV4
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    testtaker_id: DataTypes.BIGINT,   // FK -> testtakers.id
    status: {                          // 'invited','started','completed'
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'invited'
    },
    candidature_id: {           
      type: DataTypes.BIGINT,
      allowNull: false
    },
    is_deleted:{
      type: DataTypes.INTEGER,
      defaultValue:0
    },
    average: DataTypes.FLOAT,
    is_with_feedback_about_hired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reminder_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_reminder_sent: DataTypes.DATE,
    content_type_name: DataTypes.STRING,
    is_hired: DataTypes.BOOLEAN,
    personality: DataTypes.STRING,
    personality_algorithm: DataTypes.STRING,
    greenhouse_profile_url: DataTypes.STRING,
    stage: DataTypes.STRING,
    status_notification: DataTypes.STRING,
    average_with_weight: DataTypes.FLOAT
  }, {
    tableName: 'assessment_candidates',
    underscored: true,
  });

  assessment_candidates.associate = (models) => {
    // belongsTo assessments
    assessment_candidates.belongsTo(models.assessments, {
      foreignKey: 'assessment_id',
      targetKey: 'exam_id',
      as: 'assessment_info',
    });

    // hasMany assessment_attempts
    assessment_candidates.hasMany(models.assessment_attempts, {
      foreignKey: 'candidate_email',
      sourceKey: 'email',
      as: 'attempts'
    });
  };

  return assessment_candidates;
};