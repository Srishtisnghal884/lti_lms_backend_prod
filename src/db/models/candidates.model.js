module.exports = (sequelize, DataTypes) => {
  const candidates = sequelize.define('candidates', {
    id: { 
      type: DataTypes.BIGINT, 
      primaryKey: true, 
      autoIncrement: true 
    },
    email: { 
      type: DataTypes.STRING,
       unique: true 
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    
  }, {
    tableName: 'candidates',
    underscored: true,
  });
  return candidates;
};