const express = require('express');
const router = express.Router();
const store = require('../data/store');

const MIN_WITHDRAWAL = Number(process.env.MIN_WITHDRAWAL || 50);
const WITHDRAW_FEE_PERCENT = Number(process.env.WITHDRAW_FEE_PERCENT || 5);

router.post('/request', (req, res) => {
 const { userId, amount, address } = req.body;
 if (!userId || !amount || !address) return res.status(400).json({ error: 'userId, amount and address required' });
 const withdrawals = store.getWithdrawals();
 const userWithdrawals = withdrawals.filter(w => String(w.userId) === String(userId)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 if (userWithdrawals.length) {
 const last = userWithdrawals[0];
 const diff = Date.now() - new Date(last.created_at).getTime();
 if (diff < 7 * 24 * 3600 * 1000) return res.status(403).json({ error: 'only_one_withdraw_per_week' });
 }
 if (Number(amount) < MIN_WITHDRAWAL) return res.status(400).json({ error: 'below_minimum' });
 const fee = (Number(amount) * WITHDRAW_FEE_PERCENT) / 100;
 const net = Number(amount) - fee;
 const w = { id: Date.now(), userId, amount: Number(amount), fee, net, address, status: 'requested', created_at: new Date().toISOString() };
 withdrawals.push(w);
 store.saveWithdrawals(withdrawals);
 res.json({ withdrawal: w, note: 'This is a scaffold. In production integrate with your custody provider to actually send USDT.' });
});

router.get('/my', (req, res) => {
 const userId = req.query.userId;
 if (!userId) return res.status(400).json({ error: 'userId required' });
 const withdrawals = store.getWithdrawals().filter(w => String(w.userId) === String(userId));
 res.json({ withdrawals });
});

module.exports = router;