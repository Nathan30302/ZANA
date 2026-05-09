const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { verifyToken } = require('../middleware/auth');

// POST /payments/stripe/create-intent
router.post('/stripe/create-intent', verifyToken, async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const result = await paymentService.createPaymentIntent(amount, currency || 'usd', metadata || {});
    res.json({ data: result, message: 'Payment intent created' });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

// POST /payments/stripe/verify
router.post('/stripe/verify', verifyToken, async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const result = await paymentService.verifyPayment(paymentId, 'stripe');
    res.json({ data: result });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message || 'Failed to verify payment' });
  }
});

module.exports = router;
