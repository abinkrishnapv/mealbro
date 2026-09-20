'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payment.belongsTo(models.User, { foreignKey: 'userId' });
      Payment.hasMany(models.Allocation, { foreignKey: 'paymentId' });
    }
  }
  Payment.init({
    userId: { type: DataTypes.BIGINT, allowNull: false },
    amountCents: { type: DataTypes.BIGINT, allowNull: false },
    allocatedCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue:0 },
    collectedAt: { type: DataTypes.DATE, allowNull: false },
    idempotencyKey: { type: DataTypes.STRING, allowNull: false },
    driverId: { type: DataTypes.STRING,  }

  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};