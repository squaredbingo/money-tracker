// src/routes/insights.js

const express = require('express');
const { query } = require('express-validator');
const router  = express.Router();
const { getInsights } = require('../controllers/insightController');
const validateRequest = require('../middleware/validateRequest');

// GET /api/insights
router.get(
  '/',
  [
    query('sender').optional().isString().trim(),
    query('type').optional().isIn(['debit', 'credit', 'unknown']),
    query('category').optional().isString().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validateRequest,
  ],
  getInsights
);

module.exports = router;