
const express = require('express');
const router = express.Router();
const ledger = require('../services/ledger');

router.get('/customers/:userId/balance', async (req, res, next) => {
  try {
    const balance = await ledger.getBalance(req.params.userId);
    res.json(balance);
  } catch (err) { next(err); }
});

module.exports = router;