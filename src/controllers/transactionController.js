const Transaction = require('../models/Transaction');
const { parseSMS } = require('../services/smsParser');

const buildFilter = (query) => {
  const filter = {};

  if (query.sender) filter.sender = new RegExp(query.sender, 'i');
  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) filter.date.$lte = new Date(query.endDate);
  }

  return filter;
};

const getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || 50, 10)));
    const filter = buildFilter(req.query);

    const [count, transactions] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({ success: true, count, page, limit, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const seedTransactions = async (req, res) => {
  try {
    const sampleSMS = require('../data/sampleSMS');
    const parsed = sampleSMS.map(parseSMS);
    await Transaction.deleteMany();
    const saved = await Transaction.insertMany(parsed);
    res.json({ success: true, count: saved.length, data: saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { message, sender, ...fields } = req.body;
    let payload = { sender, ...fields, original: fields.original || message };

    if (message) {
      payload = parseSMS({ id: Date.now(), sender, message });
    }

    if (!payload.amount) {
      return res.status(422).json({
        success: false,
        message: 'Transaction amount is required or could not be inferred from provided data.',
      });
    }

    if (!payload.original) {
      return res.status(400).json({
        success: false,
        message: 'Original message or transaction description is required.',
      });
    }

    const duplicate = await Transaction.findOne({ sender: payload.sender, original: payload.original });
    if (duplicate) {
      return res.status(200).json({ success: true, duplicated: true, data: duplicate });
    }

    const created = await Transaction.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  seedTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};