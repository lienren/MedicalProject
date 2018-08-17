/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('WxToken', {
    openid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    access_token: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    expires_in: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    scope: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    create_at: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'WxToken'
  });
};
