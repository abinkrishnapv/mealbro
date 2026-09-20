const express = require('express');
const router = express.Router();
const ledger = require('../services/ledger');



router.post('/orders/:orderId/delivered', async (req, res, next) => {
    try {
        const orderId = Number(req.params.orderId);

        const { created, charge } = await ledger.markDelivered({ orderId })


        res.status(created ? 201 : 200).json({
            chargeId: charge.id,
            orderId: charge.orderId,
            amount: charge.amountCents / 100,
            outstanding: (charge.amountCents - charge.paidCents) / 100
        })


    } catch (err) { next(err); }
})




router.post('/customers/:userId/cash', async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const { amount, collectedAt } = req.body;
        const idempotencyKey = req.get('Idempotency-Key');

        const { created, payment } = await ledger.recordCash({
            userId, amount, collectedAt, idempotencyKey
        });

        res.status(created ? 201 : 200).json({
            paymentId: payment.id,
            amount: (payment.amountCents / 100),
            applied: (payment.allocatedCents / 100),
            heldAsAdvance: ((payment.amountCents - payment.allocatedCents) / 100)

        });
    } catch (err) { next(err); }
});

module.exports = router;