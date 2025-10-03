const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parse');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const Agent = require('../models/Agent');
const Item = require('../models/Item');
const { distributeItems } = require('../utils/distribute');

const upload = multer({ dest: 'tmp/' });

// Accepts csv, xlsx, xls, axls (axls treated as xls/xlsx)
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'File required' });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let rows = [];

    // Helper to parse CSV using a promise
    const parseCsv = (buffer) =>
      new Promise((resolve, reject) => {
        csv.parse(buffer, { columns: true, trim: true }, (err, records) => {
          if (err) return reject(err);
          resolve(records);
        });
      });

    if (ext === '.csv') {
      const content = fs.readFileSync(req.file.path);
      rows = await parseCsv(content);
    } else if (ext === '.xlsx' || ext === '.xls' || ext === '.axls') {
      const workbook = xlsx.readFile(req.file.path);
      const firstSheet = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
    } else {
      // unsupported file type -> cleanup & respond
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ msg: 'Unsupported file type' });
    }

    // Process rows
    await processRows(rows);
  } catch (err) {
    console.error(err);
    // ensure uploaded temp file is removed if exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    res.status(500).json({ msg: 'Server error', err: err.message });
  }

  // -------------------------------------
  // inner function
  // -------------------------------------
  async function processRows(rows) {
    try {
      // Normalize expected fields (case-insensitive variants)
      const normalized = rows.map((r) => ({
        firstName:
          r.FirstName || r['First Name'] || r.firstname || r.first || r['first name'] || '',
        phone: r.Phone || r.phone || r.Number || r.number || r['Phone Number'] || '',
        notes: r.Notes || r.notes || r.Remarks || r.remarks || ''
      }));

      // Basic validation
      for (const [i, row] of normalized.entries()) {
        if (!row.firstName || !row.phone) {
          // cleanup uploaded file
          if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          return res.status(400).json({
            msg: `Invalid format in row ${i + 1}. FirstName and Phone are required.`
          });
        }
      }

      // Grab agents
      const agents = await Agent.find();
      if (!agents || agents.length < 1) {
        if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ msg: 'Add agents before uploading' });
      }

      // Choose up to 5 agents; if fewer exist, use all available
      const chosenAgents = agents.slice(0, 5);
      const agentIds = chosenAgents.map((a) => a._id.toString());

      // Create items in DB with uploadBatch id
      const uploadBatch = `batch_${Date.now()}`;
      const createdItems = [];
      for (const r of normalized) {
        const item = new Item({
          firstName: r.firstName,
          phone: String(r.phone),
          notes: r.notes,
          uploadBatch
        });
        await item.save();
        createdItems.push(item);
      }

      // Distribute items among agents
      const mapping = distributeItems(createdItems, agentIds);

      // Save assignedTo for each item
      for (const agentId of Object.keys(mapping)) {
        const arr = mapping[agentId];
        for (const it of arr) {
          await Item.findByIdAndUpdate(it._id, { assignedTo: agentId });
        }
      }

      // Cleanup file
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      // Prepare response grouped by agent with items
      const response = {};
      for (const a of chosenAgents) {
        const items = await Item.find({ assignedTo: a._id, uploadBatch }).select('-__v');
        response[a._id] = {
          agent: { id: a._id, name: a.name, email: a.email, phone: a.phone },
          items
        };
      }

      return res.json({ uploadBatch, distribution: response });
    } catch (err) {
      console.error('processRows error', err);
      if (req.file && req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(500).json({ msg: 'Server error during processing', err: err.message });
    }
  }
});

// Get distributed lists by batch or agent
router.get('/lists', auth, async (req, res) => {
  try {
    const { agentId, uploadBatch } = req.query;
    const query = {};
    if (agentId) query.assignedTo = agentId;
    if (uploadBatch) query.uploadBatch = uploadBatch;
    const items = await Item.find(query).populate('assignedTo', '-password');
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
