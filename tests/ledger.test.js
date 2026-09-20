// tests/ledger.test.js
const { sequelize, User, Order } = require('../src/models');
const ledger = require('../src/services/ledger');

describe('cash-on-delivery ledger', () => {
  let user, orderA, orderB, orderC;

  beforeAll(async () => {
    // wipe and start clean
    await sequelize.query('TRUNCATE "Allocations", "Payments", "Charges", "Orders", "Users" RESTART IDENTITY CASCADE');

    user = await User.create({ name: 'Test Customer', email: 'ledger-test@example.com' });

    // three $20 orders, so we can deliver them one at a time and check math
    [orderA, orderB, orderC] = await Order.bulkCreate([
      { userId: user.id, amountCents: 2000, deliverOn: '2026-09-08' },
      { userId: user.id, amountCents: 2000, deliverOn: '2026-09-09' },
      { userId: user.id, amountCents: 2000, deliverOn: '2026-09-10' }
    ], { returning: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('oldest charge is paid first, overpayment becomes advance, advance auto-applies to the next charge', async () => {
    // deliver two $20 orders → customer owes $40 total
    await ledger.markDelivered({ orderId: orderA.id });
    await ledger.markDelivered({ orderId: orderB.id });

    let balance = await ledger.getBalance(user.id);
    const totalOwed = Number(balance.overdue) + Number(balance.currentWeek);
    expect(totalOwed).toBeCloseTo(40, 2);
    expect(balance.advance).toBe(0);

    // customer pays $50 — more than owed
    const { payment } = await ledger.recordCash({
      userId: user.id,
      amount: '50.00',
      collectedAt: new Date().toISOString()
    });

    // both $20 charges should be fully paid, $10 left as advance
    expect(payment.allocatedCents).toBe(4000);
    expect(payment.amountCents - payment.allocatedCents).toBe(1000);

    balance = await ledger.getBalance(user.id);
    expect(Number(balance.overdue) + Number(balance.currentWeek)).toBeCloseTo(0, 2);
    expect(balance.advance).toBe(10);

    // a THIRD $20 order gets delivered — the $10 advance should auto-apply
    const { charge } = await ledger.markDelivered({ orderId: orderC.id });
    expect(charge.paidCents).toBe(1000);          // $10 covered by advance
    expect(charge.amountCents - charge.paidCents).toBe(1000); // $10 still owed

    balance = await ledger.getBalance(user.id);
    expect(balance.advance).toBe(0);
    expect(Number(balance.overdue) + Number(balance.currentWeek)).toBeCloseTo(10, 2);

    // retry safety: delivering order A again must NOT create a second charge or move money
    const retry = await ledger.markDelivered({ orderId: orderA.id });
    expect(retry.created).toBe(false);
    balance = await ledger.getBalance(user.id);
    expect(Number(balance.overdue) + Number(balance.currentWeek)).toBeCloseTo(10, 2); // unchanged
  });
});