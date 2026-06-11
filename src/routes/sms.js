const express = require('express');
const { body, query } = require('express-validator');
const {
  receiveSMS,
  receiveBulkSMS,
  seedSMS,
  receiveWebhookSMS,
  getStoredSMS,
} = require('../controllers/smsController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/',
  [
    query('sender').optional().isString().trim(),
    query('type').optional().isIn(['debit', 'credit', 'unknown']),
    query('category').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validateRequest,
  ],
  getStoredSMS
);

router.post(
  '/',
  [
    body('sender').isString().notEmpty().withMessage('sender is required'),
    body('message').isString().notEmpty().withMessage('message is required'),
    validateRequest,
  ],
  receiveSMS
);

router.post('/webhook', receiveWebhookSMS);

router.post(
  '/bulk',
  [
    body().isArray({ min: 1 }).withMessage('body must be a non-empty array'),
    body('*.sender').isString().notEmpty().withMessage('sender is required'),
    body('*.message').isString().notEmpty().withMessage('message is required'),
    validateRequest,
  ],
  receiveBulkSMS
);

router.post('/seed', seedSMS);

module.exports = router;