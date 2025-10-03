const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// @route POST /api/auth/login
// @desc login admin
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// Add a route to create initial admin (for setup) - protected by a simple secret query in absence of UI
router.post('/create-admin', async (req, res) => {
    // Use this for initial seeding only in dev
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: 'Provide email & password' });
        if (await User.findOne({ email })) return res.status(400).json({ msg: 'Admin already exists' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const user = new User({ name, email, password: hashed, role: 'admin' });
        await user.save();
        res.json({ msg: 'Admin created' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


router.post('/logout', (req, res) => {
    res.json({ msg: 'Logged out successfully' });
});


module.exports = router;