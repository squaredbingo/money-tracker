/**
 * Keyword map for auto-categorizing transactions
 * Add more keywords as needed
 */
const CATEGORY_KEYWORDS = {
  Food: ["swiggy", "zomato", "restaurant", "cafe", "food", "pizza", "burger", "dining"],
  Shopping: ["amazon", "flipkart", "myntra", "meesho", "shop", "store", "mall"],
  Transport: ["uber", "ola", "rapido", "metro", "fuel", "petrol", "diesel", "irctc", "train", "flight"],
  Utilities: ["electricity", "water", "gas", "bill", "recharge", "broadband", "wifi", "internet"],
  Health: ["pharmacy", "hospital", "clinic", "apollo", "medplus", "doctor", "medicine"],
  Entertainment: ["netflix", "spotify", "prime", "hotstar", "youtube", "bookmyshow", "cinema"],
  Education: ["udemy", "coursera", "college", "school", "fee", "tuition"],
  Transfer: ["upi", "neft", "imps", "rtgs", "transfer", "sent to", "received from"],
};

/**
 * Detects whether the SMS is a credit or debit transaction
 * @param {string} text - Lowercased SMS message
 * @returns {'credit' | 'debit' | 'unknown'}
 */
function detectType(text) {
  const creditPatterns = /\b(credited|credit|received|deposited|refund|cashback|added)\b/;
  const debitPatterns = /\b(debited|debit|spent|paid|payment|withdrawn|deducted|charged)\b/;

  if (creditPatterns.test(text)) return "credit";
  if (debitPatterns.test(text)) return "debit";
  return "unknown";
}

/**
 * Extracts the transaction amount from the SMS
 * Handles formats: Rs.1500, Rs 1,500.00, INR 1500, ₹1500
 * @param {string} text - Original SMS message
 * @returns {number | null}
 */
function extractAmount(text) {
  const match = text.match(/(?:rs\.?\s?|inr\s?|₹\s?)([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

/**
 * Extracts the available balance from the SMS
 * @param {string} text - Original SMS message
 * @returns {number | null}
 */
function extractBalance(text) {
  const match = text.match(
    /(?:balance|bal|avl\.?\s?bal)[:\s]+(?:rs\.?\s?|inr\s?|₹\s?)?([\d,]+(?:\.\d{1,2})?)/i
  );
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

/**
 * Extracts the last few digits of the account/card number
 * @param {string} text - Original SMS message
 * @returns {string | null}
 */
function extractAccount(text) {
  const match = text.match(/(?:a\/c|account|ac|card)[^\d]*[xX*]+(\d{4})/i);
  if (!match) {
    // fallback: look for standalone masked pattern like XX1234
    const fallback = text.match(/[xX*]{2,}(\d{3,4})/);
    return fallback ? fallback[1] : null;
  }
  return match[1];
}

/**
 * Extracts date from the SMS if present
 * Handles: DD-Mon-YYYY, DD/MM/YYYY, DD-MM-YYYY
 * @param {string} text - Original SMS message
 * @returns {string | null}
 */
function extractDate(text) {
  const match = text.match(
    /\b(\d{1,2}[-/]\w{2,9}[-/]\d{2,4}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/
  );
  return match ? match[1] : null;
}

/**
 * Auto-categorizes a transaction based on keywords in the SMS
 * @param {string} text - Lowercased SMS message
 * @returns {string}
 */
function categorize(text) {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

/**
 * Main parser — takes a raw SMS object and returns structured transaction data
 * @param {{ id: number, sender: string, message: string }} sms
 * @returns {Object} Parsed transaction
 */
function parseSMS(sms) {
  const lowerText = sms.message.toLowerCase();

  const type = detectType(lowerText);
  const amount = extractAmount(sms.message);
  const balance = extractBalance(sms.message);
  const account = extractAccount(sms.message);
  const date = extractDate(sms.message);
  const category = categorize(lowerText);

  return {
    id: sms.id,
    sender: sms.sender,
    type,
    amount,
    balance,
    account,
    date,
    category,
    original: sms.message,
    parsedAt: new Date().toISOString(),
  };
}

module.exports = { parseSMS, detectType, extractAmount, extractBalance, categorize };