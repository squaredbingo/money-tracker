
const sampleMessages = require('../data/sampleSMS');
const { receiveSMS, receiveBulkSMS, seedSMS } = require('../controllers/smsController');
const express = require('express');
const router  = express.Router();

// Parser function
function parseSMS(sms) {
  const text = sms.message.toLowerCase();

  // Detect type
  const isCredit = /credited|credit|received|deposited/.test(text);
  const isDebit = /debited|debit|spent|paid/.test(text);

  // Extract amount (handles Rs., INR, ₹)
  const amountMatch = sms.message.match(/(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  // Extract balance
  const balanceMatch = sms.message.match(/balance[:\s]+(?:rs\.?|inr|₹)?\s?([\d,]+(?:\.\d{1,2})?)/i);
  const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null;

  return {
    id: sms.id,
    sender: sms.sender,
    original: sms.message,
    type: isCredit ? 'credit' : isDebit ? 'debit' : 'unknown',
    amount,
    balance,
  };
}

// GET /api/sms — return all parsed messages
router.get('/', (req, res) => {
  const parsed = sampleMessages.map(parseSMS);
  res.json({ success: true, count: parsed.length, data: parsed });
});

// GET /api/sms/raw — return raw messages
router.get('/raw', (req, res) => {
  res.json({ success: true, data: sampleMessages });
});

// src/routes/sms.js


// POST /api/sms         — send a single SMS
router.post('/',       receiveSMS);

// POST /api/sms/bulk   — send multiple SMS at once
router.post('/bulk',   receiveBulkSMS);

// POST /api/sms/seed   — seed DB with sampleSMS.js data
router.post('/seed',   seedSMS);

module.exports = router;