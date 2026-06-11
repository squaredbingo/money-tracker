// src/controllers/insightController.js

const Transaction = require('../models/Transaction');

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

/**
 * GET /api/insights
 * Returns aggregated analytics data for the frontend dashboard
 */
const getInsights = async (req, res) => {
  try {
    const filter = buildFilter(req.query);

    // ── 1. Total count ──────────────────────────────────────────────
    const totalCount = await Transaction.countDocuments(filter);

    // ── 2. Overall totals (debit / credit) ─────────────────────────
    const totalsAgg = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Shape totals into a flat object
    const totals = { totalDebit: 0, totalCredit: 0, debitCount: 0, creditCount: 0 };
    totalsAgg.forEach(t => {
      if (t._id === 'debit') {
        totals.totalDebit  = t.total;
        totals.debitCount  = t.count;
      }
      if (t._id === 'credit') {
        totals.totalCredit  = t.total;
        totals.creditCount  = t.count;
      }
    });

    // ── 3. Spending breakdown by category (debits only) ─────────────
    const bySpendCategory = await Transaction.aggregate([
      { $match: { ...filter, type: 'debit' } },
      {
        $group: {
          _id:   '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // ── 4. Breakdown by type (for byCategory fallback) ──────────────
    const byCategory = totalsAgg;

    // ── 5. Monthly trend (group by month) ───────────────────────────
    const monthly = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year:  { $year:  '$date' },
            type:  '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // ── 6. Top senders ───────────────────────────────────────────────
    const topSenders = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id:   '$sender',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // ── 7. Highest single transactions ───────────────────────────────
    const highestDebit = await Transaction
      .findOne({ ...filter, type: 'debit' })
      .sort({ amount: -1 })
      .select('sender amount category date');

    const highestCredit = await Transaction
      .findOne({ ...filter, type: 'credit' })
      .sort({ amount: -1 })
      .select('sender amount category date');

    // ── 8. Net balance ───────────────────────────────────────────────
    const net = totals.totalCredit - totals.totalDebit;

    // ── Response ─────────────────────────────────────────────────────
    res.json({
      success: true,
      totalCount,
      totals,
      net,
      bySpendCategory,
      byCategory,
      monthly,
      topSenders,
      highlights: {
        highestDebit,
        highestCredit,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInsights };