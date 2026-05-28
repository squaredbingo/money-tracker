// Auto-categorize transactions
module.exports = {
  categorize: (transaction) => {
    // TODO: implement categorization logic
    return Object.assign({}, transaction, { category: 'uncategorized' });
  }
};
