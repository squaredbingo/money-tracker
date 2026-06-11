const { parseSMS, detectType, extractAmount, categorize } = require('../src/services/smsParser');

describe('SMS parser', () => {
  it('correctly parses a debit SMS and extracts merchant and date', () => {
    const sms = {
      id: 1,
      sender: 'HDFCBank',
      message: 'Rs.299.00 debited from your account XX5678 for Swiggy order on 01-May-2026. Avl Bal: Rs.12,450.00',
    };

    const parsed = parseSMS(sms);

    expect(parsed.type).toBe('debit');
    expect(parsed.amount).toBe(299);
    expect(parsed.balance).toBe(12450);
    expect(parsed.merchant.toLowerCase()).toContain('swiggy');
    expect(parsed.category).toBe('Food');
    expect(parsed.date).toEqual(expect.any(Date));
  });

  it('detects credit transactions', () => {
    const text = 'Your wallet has been credited with Rs.500.00 on 10-Jun-2026.';
    expect(detectType(text.toLowerCase())).toBe('credit');
  });

  it('returns unknown for neutral messages', () => {
    const text = 'This is a generic notification about your account.';
    expect(detectType(text.toLowerCase())).toBe('unknown');
  });

  it('extracts the amount from different currency formats', () => {
    expect(extractAmount('INR 1,200.50 spent')).toBe(1200.5);
    expect(extractAmount('₹450 charged')).toBe(450);
    expect(extractAmount('Rs.2,999 debited')).toBe(2999);
  });

  it('categorizes transactions using message keywords', () => {
    expect(categorize('paid for netflix subscription', null)).toBe('Entertainment');
    expect(categorize('neft transfer to friend', null)).toBe('Transfer');
  });
});
