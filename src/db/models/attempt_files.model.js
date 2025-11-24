module.exports = (sequelize, DataTypes) => {
  const attempt_files = sequelize.define('attempt_files', {
    id: { type: DataTypes.BIGINT, primaryKey: true, allowNull: false, autoIncrement:true },
    attempt_id: { type: DataTypes.BIGINT, allowNull: false },
    file_type: DataTypes.STRING, // 'pdf','raw_json'
    url: DataTypes.STRING,
    metadata: DataTypes.JSONB
  }, {
    tableName: 'attempt_files',
    underscored: true
  });

  return attempt_files;
};
