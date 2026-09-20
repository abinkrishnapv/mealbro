// seeders/20260920120000-demo-customer.js
'use strict';

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // insert the user, and ask Postgres to hand back the generated id
    const [user] = await queryInterface.bulkInsert(
      'Users',
      [{
        name: 'Priya Menon',
        email: `priya+${Date.now()}@example.com`,
        createdAt: now,
        updatedAt: now
      }],
      { returning: true }   // Postgres-specific: gives us the inserted row back, including its id
    );

    const userId = user.id;

    await queryInterface.bulkInsert('Orders', [
      { userId, amountCents: 2000, deliverOn: isoDateDaysAgo(9), status: 'scheduled', createdAt: now, updatedAt: now },
      { userId, amountCents: 2000, deliverOn: isoDateDaysAgo(8), status: 'scheduled', createdAt: now, updatedAt: now },
      { userId, amountCents: 2000, deliverOn: isoDateDaysAgo(7), status: 'scheduled', createdAt: now, updatedAt: now },
      { userId, amountCents: 2500, deliverOn: isoDateDaysAgo(1), status: 'scheduled', createdAt: now, updatedAt: now },
      { userId, amountCents: 1000, deliverOn: isoDateDaysAgo(0), status: 'scheduled', createdAt: now, updatedAt: now }
    ]);

    console.log(`Seeded user ${userId} with 5 orders`);
  },

  async down(queryInterface) {
    // undo in reverse: delete orders belonging to any user matching this seed pattern, then the user(s)
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email LIKE 'priya+%@example.com'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const userIds = users.map(u => u.id);

    if (userIds.length) {
      await queryInterface.bulkDelete('Orders', { userId: userIds });
      await queryInterface.bulkDelete('Users', { id: userIds });
    }
  }
};