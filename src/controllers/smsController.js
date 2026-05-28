// src/controllers/smsController.js

const Transaction = require('../models/Transaction');
const { parseSMS } = require('../services/smsParser');

/**
 * POST /api/sms
 * Accepts a single SMS object, parses it, and saves to DB
 *
 * Body:
 * {
 *   "sender": "HDFCBank",
 *   "message": "Rs.500.00 debited from account XX1234 on 25-May-2026. Balance Rs.4,500.00"
 * }
 */
const receiveSMS = async (req, res) => {
  try {
    const { sender, message } = req.body;

    // ── Validate ──
    if (!sender || !message) {
      return res.status(400).json({
        success: false,
        message: 'Both "sender" and "message" fields are required.',
      });
    }

    // ── Parse ──
    const parsed = parseSMS({ id: Date.now(), sender, message });

    // ── Save to DB ──
    const transaction = await Transaction.create(parsed);

    res.status(201).json({
      success: true,
      message: 'SMS received and stored successfully.',
      data: transaction,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/sms/bulk
 * Accepts an array of SMS objects, parses all, and saves to DB
 *
 * Body:
 * [
 *   { "sender": "HDFCBank", "message": "..." },
 *   { "sender": "ICICIBank", "message": "..." }
 * ]
 */
const receiveBulkSMS = async (req, res) => {
  try {
    const messages = req.body;

    // ── Validate ──
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a non-empty array of SMS objects.',
      });
    }

    const invalid = messages.find(m => !m.sender || !m.message);
    if (invalid) {
      return res.status(400).json({
        success: false,
        message: 'Each SMS object must have "sender" and "message" fields.',
      });
    }

    // ── Parse all ──
    const parsed = messages.map((sms, i) =>
      parseSMS({ id: Date.now() + i, sender: sms.sender, message: sms.message })
    );

    // ── Save to DB ──
    const saved = await Transaction.insertMany(parsed);

    res.status(201).json({
      success: true,
      message: `${saved.length} SMS messages received and stored.`,
      count: saved.length,
      data: saved,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/sms/seed
 * Parses sampleSMS.js and seeds the database (clears existing data first)
 * Useful for resetting to test data
 */
const seedSMS = async (req, res) => {
  try {
    const sampleSMS = require('../data/sampleSMS');

    const parsed = sampleSMS.map(parseSMS);

    await Transaction.deleteMany();
    const saved = await Transaction.insertMany(parsed);

    res.status(201).json({
      success: true,
      message: `Database seeded with ${saved.length} transactions.`,
      count: saved.length,
      data: saved,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { receiveSMS, receiveBulkSMS, seedSMS };