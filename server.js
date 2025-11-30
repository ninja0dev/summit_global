// Scaffold inicial Express — endpoints mínimos de saúde/auth
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

// Simple health
app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'dev' }));

// Routers
app.use('/auth', require('./routes/auth'));
app.use('/deposits', require('./routes/deposits'));
app.use('/withdrawals', require('./routes/withdrawals'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));