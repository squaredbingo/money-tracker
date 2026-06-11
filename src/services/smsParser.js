const CATEGORY_KEYWORDS = {
  Food: ['swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'pizza', 'burger', 'dining', 'dominos', 'mcdonalds'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'meesho', 'shop', 'store', 'mall', 'nykaa', 'croma', 'big bazaar'],
  Transport: ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'irctc', 'train', 'flight', 'airtel', 'indiGo'],
  Utilities: ['electricity', 'water', 'gas', 'bill', 'recharge', 'broadband', 'wifi', 'internet', 'postpaid'],
  Health: ['pharmacy', 'hospital', 'clinic', 'apollo', 'medplus', 'doctor', 'medicine', 'pharma'],
  Entertainment: ['netflix', 'spotify', 'prime', 'hotstar', 'youtube', 'bookmyshow', 'cinema', 'movie'],
  Education: ['udemy', 'coursera', 'college', 'school', 'fee', 'tuition'],
  Transfer: ['upi', 'neft', 'imps', 'rtgs', 'transfer', 'sent to', 'received from', 'credited', 'deposited'],
};

const AMOUNT_PATTERNS = [
  /(?:debited\s+with|credited\s+with|deducted\s+from|paid\s+at|paid\s+for|spent\s+at|paid\s+to|charged\s+to|paid\s+on|payment\s+of)\s*(?:rs\.?\s?|inr\s?|₹\s*)?([\d,]+(?:\.\d{1,2})?)/i,
  /(?:rs\.?\s?|inr\s?|₹\s*)([\d,]+(?:\.\d{1,2})?)/i,
];

const BALANCE_PATTERNS = [
  /(?:available\s+balance|available\s+bal(?:ance)?|avl\.?\s*bal(?:ance)?|balance|bal)[:\s]*?(?:rs\.?\s?|inr\s?|₹\s*)?([\d,]+(?:\.\d{1,2})?)/i,
];

const DATE_PATTERNS = [
  /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/, // 23-05-2026 / 23/05/2026
  /\b(\d{1,2}[-/](?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/]\d{2,4})\b/i, // 23-May-2026
  /\b((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
];

function normalizeNumber(value) {
  if (!value) return null;
  return parseFloat(value.replace(/[\s,]/g, ''));
}

function detectType(text) {
  const creditPatterns = /\b(?:credited|credit|received|deposited|refund|cashback|added)\b/;
  const debitPatterns = /\b(?:debited|debit|spent|paid|payment|withdrawn|deducted|charged)\b/;
  if (creditPatterns.test(text)) return 'credit';
  if (debitPatterns.test(text)) return 'debit';
  return 'unknown';
}

function extractAmount(text) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeNumber(match[1]);
    }
  }

  const general = text.match(/(?:rs\.?\s?|inr\s?|₹\s*)([\d,]+(?:\.\d{1,2})?)/i);
  return general ? normalizeNumber(general[1]) : null;
}

function extractBalance(text) {
  for (const pattern of BALANCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeNumber(match[1]);
    }
  }
  return null;
}

function extractAccount(text) {
  const accountPattern = /(?:a\/c|account|ac|card)[^\d]*[xX*]+(\d{3,4})/i;
  const match = text.match(accountPattern);
  if (match && match[1]) return match[1];

  const fallback = text.match(/[xX*]{2,}(\d{3,4})/);
  return fallback ? fallback[1] : null;
}

function extractDate(text) {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const parsed = new Date(match[1].replace(/-/g, ' ').replace(/\b(\d{1,2})\b/g, '$1'));
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  return null;
}

function extractMerchant(text) {
  const merchantPatterns = [
    /(?:at|for|to|from)\s+([A-Za-z0-9 &().'-]{3,40})(?:\s+on|\s+from|\.|,|$)/i,
    /(?:payment\s+for|for)\s+([A-Za-z0-9 &().'-]{3,40})(?:\s+on|\s+from|\.|,|$)/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const merchant = match[1].trim();
      if (!/account|a\/c|balance|avl|credited|debited/i.test(merchant)) {
        return merchant;
      }
    }
  }

  return null;
}

function categorize(text, merchant) {
  const searchText = `${text} ${merchant || ''}`;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => searchText.includes(keyword))) {
      return category;
    }
  }
  return 'Other';
}

function parseSMS(sms) {
  const text = sms.message || '';
  const lowerText = text.toLowerCase();

  const type = detectType(lowerText);
  const amount = extractAmount(text);
  const balance = extractBalance(text);
  const account = extractAccount(text);
  const transactionDate = extractDate(text);
  const merchant = extractMerchant(text);
  const category = categorize(lowerText, merchant);

  return {
    id: sms.id,
    sender: sms.sender,
    type,
    amount,
    balance,
    account,
    date: transactionDate,
    merchant,
    category,
    original: text,
    parsedAt: new Date(),
  };
}

module.exports = { parseSMS, detectType, extractAmount, extractBalance, categorize };
