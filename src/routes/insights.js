// src/routes/insights.js

const express = require('express');
const router  = express.Router();
const { getInsights } = require('../controllers/insightController');

// GET /api/insights
router.get('/', getInsights);

module.exports = router;