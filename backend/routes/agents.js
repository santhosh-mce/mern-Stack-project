const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const Agent = require('../models/Agent');


// Create agent
router.post('/', auth, async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!name || !email || !phone || !password) return res.status(400).json({ msg: 'All fields required' });
        if (await Agent.findOne({ email })) return res.status(400).json({ msg: 'Agent already exists' });
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        const agent = new Agent({ name, email, phone, password: hashed });
        await agent.save();
        res.json(agent);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


// List agents
router.get('/', auth, async (req, res) => {
    try {
        const agents = await Agent.find().select('-password');
        res.json(agents);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});


module.exports = router;