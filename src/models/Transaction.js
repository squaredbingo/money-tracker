const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    sender:   { type: String },
    type:     { type: String, enum: ['credit', 'debit', 'unknown'], default: 'unknown' },
    amount:   { type: Number },
    balance:  { type: Number },
    account:  { type: String },
    date:     { type: String },
    category: { type: String, default: 'Other' },
    original: { type: String }, // raw SMS message
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Transaction', transactionSchema);