const express = require('express');
const { body, query } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const {
  getTransactions,
  getTransactionById,
  seedTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

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
  getTransactions
);

router.get('/:id', getTransactionById);

router.post(
  '/',
  [
    body('sender').isString().notEmpty().withMessage('sender is required'),
    body('amount').optional().isNumeric().withMessage('amount must be a number'),
    body('type').optional().isIn(['debit', 'credit', 'unknown']),
    body('date').optional().isISO8601().withMessage('date must be ISO-8601'),
    validateRequest,
  ],
  createTransaction
);

router.post('/seed', seedTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;