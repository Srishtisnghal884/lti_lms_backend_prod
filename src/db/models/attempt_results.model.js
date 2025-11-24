module.exports = (sequelize, DataTypes) => {
  const attempt_results = sequelize.define('attempt_results', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    attempt_id: {            // FK -> assessment_attempts.id
      type: DataTypes.BIGINT,
      allowNull: false
    },
    score: DataTypes.FLOAT,
    percentile : DataTypes.STRING,
    result_json: DataTypes.JSONB,  // full response from TestGorilla (detailed)
    pdf_url: DataTypes.STRING,     // location in S3/local
    processed_at: DataTypes.DATE
  }, {
    tableName: 'attempt_results',
    underscored: true,
  });
  
  attempt_results.associate = (models) => {
    attempt_results.belongsTo(models.assessment_attempts, {
      foreignKey: 'attempt_id',
      as: 'attempt',
    });
  };
  return attempt_results;
};
