'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Charges', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'RESTRICT'
      },
      orderId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        references: { model: 'Orders', key: 'id' },
        onDelete: 'RESTRICT'
      },
      amountCents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      paidCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue:0
      },
      chargedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      isoYear: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isoWeek: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      weekStart: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      weekEnd: {
        type: Sequelize.DATEONLY,
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

      await queryInterface.sequelize.query(`
      ALTER TABLE "Charges"
        ADD CONSTRAINT charges_amount_positive CHECK ("amountCents" > 0),
        ADD CONSTRAINT charges_paid_within_bounds CHECK ("paidCents" >= 0 AND "paidCents" <= "amountCents")
    `);

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Charges');
  }
};