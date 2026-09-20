'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Charge extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Charge.belongsTo(models.User, { foreignKey: 'userId' });
      Charge.belongsTo(models.Order, { foreignKey: 'orderId' });
       Charge.hasMany(models.Allocation, { foreignKey: 'chargeId' });
    }
    outstandingCents() {
      return this.amountCents - this.paidCents;
    }
  }
  Charge.init({
    userId: { type: DataTypes.BIGINT, allowNull: false },
    orderId: { type: DataTypes.BIGINT, allowNull: false },
    amountCents: { type: DataTypes.INTEGER, allowNull: false },
    paidCents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    chargedAt: { type: DataTypes.DATE, allowNull: false },
    isoYear: { type: DataTypes.INTEGER, allowNull: false },
    isoWeek: { type: DataTypes.INTEGER, allowNull: false },
    weekStart: { type: DataTypes.DATEONLY, allowNull: false },
    weekEnd: { type: DataTypes.DATEONLY, allowNull: false }
  }, {
    sequelize,
    modelName: 'Charge',
    tableName:'Charges'
  });
  return Charge;
};