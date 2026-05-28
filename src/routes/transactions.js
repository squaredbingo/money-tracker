const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransactionById,
  seedTransactions,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');

router.get('/',         getTransactions);
router.get('/:id',      getTransactionById);
router.post('/seed',    seedTransactions);
router.put('/:id',      updateTransaction);
router.delete('/:id',   deleteTransaction);

module.exports = router;