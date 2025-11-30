const express = require('express');
const router = express.Router();
const store = require('../data/store');

// Mock create deposit — with MetaMask custody the client will sign/send the transaction.
router.post('/create', (req, res) => {
 const { userId, amount, chain } = req.body;
 if (!userId || !amount) return res.status(400).json({ error: 'userId and amount required' });
 // Minimal validation
 const deposits = store.getDeposits();
 const deposit = { id: Date.now(), userId, amount: Number(amount), chain: chain || process.env.USDT_CHAIN || 'BEP20', status: 'pending', created_at: new Date().toISOString() };
 deposits.push(deposit);
 store.saveDeposits(deposits);
 res.json({ deposit, instructions: 'This is a mock. In production generate an on-chain payment request or instruct the user to send USDT via MetaMask to the designated address.' });
});

router.get('/my', (req, res) => {
 const userId = req.query.userId;
 if (!userId) return res.status(400).json({ error: 'userId required' });
 const deposits = store.getDeposits().filter(d => String(d.userId) === String(userId));
 res.json({ deposits });
});

module.exports = router;