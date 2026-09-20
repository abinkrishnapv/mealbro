const { sequelize, User, Order, Charge, Payment, Allocation } = require('../models');
const { weekOf } = require('../lib/weeks');

async function applyPaymentToOutstandingCharges(payment, tx) {
    let remaining = payment.amountCents - payment.allocatedCents;
    if (remaining <= 0) return;

    // oldest unpaid charges first
    const charges = await Charge.findAll({
        where: { userId: payment.userId },
        order: [['weekStart', 'ASC'], ['chargedAt', 'ASC'], ['id', 'ASC']],
        transaction: tx,
        lock: tx.LOCK.UPDATE
    });

    for (const charge of charges) {
        if (remaining <= 0) break;

        const outstanding = charge.amountCents - charge.paidCents;
        if (outstanding <= 0) continue; // already full paid, skip

        const amountToApply = Math.min(outstanding, remaining);

        await Allocation.create({
            paymentId: payment.id,
            chargeId: charge.id,
            amountCents: amountToApply
        }, { transaction: tx });

        charge.paidCents += amountToApply;
        await charge.save({ transaction: tx });

        payment.allocatedCents += amountToApply;
        remaining -= amountToApply;
    }

    await payment.save({ transaction: tx });
}


async function getBalance(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error(`No customer with id ${userId}`);
    err.status = 404;
    throw err;
  }

  const charges = await Charge.findAll({
    where: { userId },
    order: [['weekStart', 'ASC'], ['chargedAt', 'ASC']],
    include: [{ model: Allocation, include: [Payment] }]
  });

  const payments = await Payment.findAll({
    where: { userId },
    order: [['collectedAt', 'ASC']],
    include: [{ model: Allocation, include: [Charge] }]
  });

  const thisWeek = weekOf(new Date(), user.timezone);

  let overdueCents = 0;
  let currentWeekCents = 0;

  const chargeHistory = charges.map(charge => {
    const outstanding = charge.amountCents - charge.paidCents;
    const isCurrent = charge.weekStart === thisWeek.weekStart;
    const isPast = charge.weekStart < thisWeek.weekStart;

    if (isPast) overdueCents += outstanding;
    if (isCurrent) currentWeekCents += outstanding;

    return {
      chargeId: charge.id,
      orderId: charge.orderId,
      amount: (charge.amountCents / 100),
      paid: (charge.paidCents / 100),
      outstanding: (outstanding / 100),
      week: charge.weekStart,
      status: outstanding === 0 ? 'settled' : isCurrent ? 'current' : isPast ? 'overdue' : 'upcoming',
      paidBy: charge.Allocations.map(a => ({
        paymentId: a.paymentId,
        amount: (a.amountCents / 100)
      }))
    };
  });

  const advanceCents = payments.reduce(
    (sum, p) => sum + (p.amountCents - p.allocatedCents),
    0
  );

  const paymentHistory = payments.map(payment => ({
    paymentId: payment.id,
    amount: (payment.amountCents / 100),
    collectedAt: payment.collectedAt,
    appliedToCharges: payment.Allocations.map(a => ({
      chargeId: a.chargeId,
      amount: (a.amountCents / 100)
    })),
    heldAsAdvance: ((payment.amountCents - payment.allocatedCents) / 100).toFixed(2)
  }));

  return {
    userId: user.id,
    overdue: (overdueCents / 100),
    currentWeek: (currentWeekCents / 100),
    advance: (advanceCents / 100),
    history: { charges: chargeHistory, payments: paymentHistory }
  };
}


async function markDelivered({ orderId }) {
    const order = await Order.findByPk(orderId);
    if (!order) {
        const err = new Error(`No order with id ${orderId}`);
        err.status = 404;
        throw err;
    }

    return sequelize.transaction(async (tx) => {
        const user = await User.findByPk(order.userId, {
            lock: tx.LOCK.UPDATE,
            transaction: tx
        });
        if (!user) {
            const err = new Error(`No customer with id ${order.userId}`);
            err.status = 404;
            throw err;
        }

        // check this order already been charged - for retry
        const existing = await Charge.findOne({
            where: { orderId },
            transaction: tx
        });
        if (existing) {
            return { created: false, charge: existing };
        }

        const chargedAt = new Date();
        const week = weekOf(chargedAt, user.timezone);


        const charge = await Charge.create({
            userId: order.userId,
            orderId: order.id,
            amountCents: order.amountCents,
            paidCents: 0,
            chargedAt,
            isoYear: week.isoYear,
            isoWeek: week.isoWeek,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd
        }, { transaction: tx });

        // 
        await applyAdvanceToCharge(charge, tx);

        order.status = 'delivered';
        order.deliveredAt = chargedAt;
        await order.save({ transaction: tx });

        return { created: true, charge };
    });
}

async function applyAdvanceToCharge(charge, tx) {
  let remaining = charge.amountCents - charge.paidCents;
  if (remaining <= 0) return;

  // oldest leftover payments first
  const payments = await Payment.findAll({
    where: { userId: charge.userId },
    order: [['collectedAt', 'ASC'], ['id', 'ASC']],
    transaction: tx,
    lock: tx.LOCK.UPDATE
  });

  for (const payment of payments) {
    if (remaining <= 0) break;

    const available = payment.amountCents - payment.allocatedCents;
    if (available <= 0) continue;

    const amountToApply = Math.min(available, remaining);

    await Allocation.create({
      paymentId: payment.id,
      chargeId: charge.id,
      amountCents: amountToApply
    }, { transaction: tx });

    payment.allocatedCents += amountToApply;
    await payment.save({ transaction: tx });

    charge.paidCents += amountToApply;
    remaining -= amountToApply;
  }

  await charge.save({ transaction: tx });
}



async function recordCash({ userId, amount, collectedAt, idempotencyKey }) {
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
        const err = new Error('amount must be a positive number');
        err.status = 400;
        throw err;
    }

    return sequelize.transaction(async (tx) => {
        const user = await User.findByPk(userId, { lock: tx.LOCK.UPDATE, transaction: tx });
        if (!user) {
            const err = new Error(`No customer with id ${userId}`);
            err.status = 404;
            throw err;
        }

        const key = idempotencyKey || `derived:${userId}:${amountCents}:${collectedAt || 'now'}`;

        const existing = await Payment.findOne({
            where: { userId, idempotencyKey: key },
            transaction: tx
        });
        if (existing) {
            return { created: false, payment: existing };
        }

        const payment = await Payment.create({
            userId,
            amountCents,
            allocatedCents: 0,
            collectedAt: collectedAt ? new Date(collectedAt) : new Date(),
            idempotencyKey: key,
        }, { transaction: tx });

        await applyPaymentToOutstandingCharges(payment, tx);

        return { created: true, payment };
    });
}

module.exports = { markDelivered, recordCash, getBalance };


