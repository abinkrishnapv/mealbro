'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
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
      amountCents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      allocatedCents: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      collectedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      idempotencyKey: {
        type: Sequelize.STRING,
        allowNull: false
      },
      driverId: {
        type: Sequelize.STRING,
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
    await queryInterface.addConstraint('Payments', {
      fields: ['userId', 'idempotencyKey'],
      type: 'unique',
      name: 'payments_user_idempotency_key_unique'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE "Payments"
        ADD CONSTRAINT payments_amount_positive CHECK ("amountCents" > 0),
        ADD CONSTRAINT payments_allocated_within_bounds
          CHECK ("allocatedCents" >= 0 AND "allocatedCents" <= "amountCents")
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};