'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Allocation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Allocation.belongsTo(models.Payment, { foreignKey: 'paymentId' });
      Allocation.belongsTo(models.Charge, { foreignKey: 'chargeId' });
    }
  }
  Allocation.init({
    paymentId: { type: DataTypes.BIGINT, allowNull: false },
    chargeId: { type: DataTypes.BIGINT, allowNull: false },
    amountCents: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Allocation',
    tableName: 'Allocations'
  });
  return Allocation;
};