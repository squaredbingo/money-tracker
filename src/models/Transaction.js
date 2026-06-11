const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'unknown'],
      default: 'unknown',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      default: null,
      min: 0,
    },
    account: {
      type: String,
      trim: true,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    merchant: {
      type: String,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      default: 'Other',
      trim: true,
    },
    original: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ sender: 1, original: 1 }, { unique: true });

module.exports = mongoose.model('Transaction', transactionSchema);