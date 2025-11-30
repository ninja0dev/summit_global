const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const store = require('../data/store');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_replace_with_secure_value';

router.post('/register', async (req, res) => {
 const { name, email, password, referrer } = req.body;
 if (!email || !password) return res.status(400).json({ error: 'email and password required' });
 const users = store.getUsers();
 if (users.find(u => u.email === email)) return res.status(409).json({ error: 'user_exists' });
 const hash = await bcrypt.hash(password, 10);
 const user = { id: Date.now(), name: name || '', email, password: hash, referrer: referrer || null, created_at: new Date().toISOString() };
 users.push(user);
 store.saveUsers(users);
 const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
 res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/login', async (req, res) => {
 const { email, password } = req.body;
 const users = store.getUsers();
 const user = users.find(u => u.email === email);
 if (!user) return res.status(401).json({ error: 'invalid_credentials' });
 const ok = await bcrypt.compare(password, user.password);
 if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
 const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
 res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.get('/me', (req, res) => {
 const auth = req.headers.authorization;
 if (!auth) return res.status(401).json({ error: 'no_auth' });
 const parts = auth.split(' ');
 if (parts.length !== 2) return res.status(401).json({ error: 'malformed_auth' });
 try {
 const payload = jwt.verify(parts[1], JWT_SECRET);
 const users = store.getUsers();
 const user = users.find(u => u.id === payload.id);
 if (!user) return res.status(404).json({ error: 'user_not_found' });
 res.json({ user: { id: user.id, email: user.email, name: user.name, referrer: user.referrer } });
 } catch (err) {
 return res.status(401).json({ error: 'invalid_token' });
 }
});

module.exports = router;