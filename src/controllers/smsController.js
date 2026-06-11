const Transaction = require('../models/Transaction');
const { parseSMS } = require('../services/smsParser');

const findDuplicate = async ({ sender, original }) => Transaction.findOne({ sender, original });

const saveTransaction = async (parsed) => {
  try {
    const duplicate = await findDuplicate(parsed);
    if (duplicate) return { transaction: duplicate, duplicated: true };
    const created = await Transaction.create(parsed);
    return { transaction: created, duplicated: false };
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await findDuplicate(parsed);
      return { transaction: duplicate, duplicated: true };
    }
    throw error;
  }
};

const getWebhookSender = (body) => body.sender || body.From || body.from || body.Sender || body.source;
const getWebhookMessage = (body) => body.message || body.Body || body.body || body.Text || body.text;

const getStoredSMS = async (req, res) => {
  try {
    const { sender, type, category, page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = {};

    if (sender) filter.sender = new RegExp(sender, 'i');
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [count, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize),
    ]);

    res.json({
      success: true,
      count,
      page: pageNumber,
      limit: pageSize,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const receiveSMS = async (req, res) => {
  try {
    const { sender, message } = req.body;
    const parsed = parseSMS({ id: Date.now(), sender, message });

    if (!parsed.amount) {
      return res.status(422).json({
        success: false,
        message: 'Unable to parse a valid transaction amount from the message.',
      });
    }

    const { transaction, duplicated } = await saveTransaction(parsed);
    res.status(duplicated ? 200 : 201).json({
      success: true,
      message: duplicated ? 'Duplicate SMS ignored.' : 'SMS received and stored successfully.',
      duplicated,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const receiveBulkSMS = async (req, res) => {
  try {
    const messages = req.body;
    const parsed = messages.map((sms, i) => parseSMS({ id: Date.now() + i, sender: sms.sender, message: sms.message }));

    const results = [];
    for (const sms of parsed) {
      const { transaction, duplicated } = await saveTransaction(sms);
      results.push({ duplicated, transaction });
    }

    res.status(201).json({
      success: true,
      message: `${results.length} SMS messages processed.`,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

const receiveWebhookSMS = async (req, res) => {
  try {
    const sender = getWebhookSender(req.body);
    const message = getWebhookMessage(req.body);

    if (!sender || !message) {
      return res.status(400).json({
        success: false,
        message: 'Webhook payload must include sender and message text.',
      });
    }

    const parsed = parseSMS({ id: Date.now(), sender, message });
    const { transaction, duplicated } = await saveTransaction(parsed);

    res.status(duplicated ? 200 : 201).json({
      success: true,
      message: duplicated ? 'Duplicate webhook SMS ignored.' : 'Webhook SMS received and stored successfully.',
      duplicated,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { receiveSMS, receiveBulkSMS, seedSMS, receiveWebhookSMS, getStoredSMS };
