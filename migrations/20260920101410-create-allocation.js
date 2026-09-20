'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Allocations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      paymentId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Payments', Key: 'id' },
        onDelete: 'RESTRICT'
      },
      chargeId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Charges', key: 'id' },
        onDelete: 'RESTRICT'
      },
      amountCents: {
        type: Sequelize.INTEGER,
        allowNull: false
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
      'ALTER TABLE "Allocations" ADD CONSTRAINT allocations_amount_positive CHECK ("amountCents" > 0)'
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Allocations');
  }
};