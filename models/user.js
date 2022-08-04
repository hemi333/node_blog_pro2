'use strict';
const {
  Model   // Model 클래스 가져오기
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init({
    userId: {
      primaryKey: true,
      type: DataTypes.INTEGER, // 정수형태 숫자
    },
    nickname: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};

// models> index.js파일을 통해서 로딩이 됨