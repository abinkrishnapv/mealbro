'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'userId' });
    }
  }
  Order.init({
    userId: { type: DataTypes.BIGINT, allowNull: false },
    amountCents: { type: DataTypes.INTEGER, allowNull: false },
    deliverOn: { type: DataTypes.DATEONLY, allowNull: false},
    status: {
      type: DataTypes.ENUM('scheduled', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    deliveredAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'Orders',
  });
  return Order
};