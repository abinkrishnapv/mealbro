'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      amountCents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      deliverOn: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      }
    });
    await queryInterface.sequelize.query(
      'ALTER TABLE "Orders" ADD CONSTRAINT orders_amount_positive CHECK ("amountCents" > 0)'
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};