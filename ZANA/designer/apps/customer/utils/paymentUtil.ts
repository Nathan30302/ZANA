// Payment utilities for mobile apps
export class PaymentUtil {
  static validateCardNumber(cardNumber) {
    // Luhn algorithm for card validation
    const sanitized = cardNumber.replace(/\D/g, '');
    if (sanitized.length < 13 || sanitized.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  static formatCardNumber(cardNumber) {
    const sanitized = cardNumber.replace(/\D/g, '');
    return sanitized.replace(/(\d{4})/g, '$1 ').trim();
  }

  static validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv.replace(/\D/g, ''));
  }

  static validateExpiryDate(month, year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (m < 1 || m > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    if (y < currentYear) return false;
    if (y === currentYear && m < currentMonth) return false;

    return true;
  }

  static maskCardNumber(cardNumber) {
    const sanitized = cardNumber.replace(/\D/g, '');
    return sanitized.slice(-4).padStart(sanitized.length, '*');
  }

  static getCardType(cardNumber) {
    const sanitized = cardNumber.replace(/\D/g, '');

    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(sanitized)) return 'VISA';
    if (/^5[1-5][0-9]{14}$/.test(sanitized)) return 'MASTERCARD';
    if (/^3[47][0-9]{13}$/.test(sanitized)) return 'AMEX';
    if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(sanitized)) return 'DISCOVER';

    return 'UNKNOWN';
  }

  static formatCurrency(amount, currency = 'ZMW') {
    const formatter = new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(amount);
  }

  static calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }

  static calculateDiscount(amount, discountPercentage) {
    return Math.round((amount * discountPercentage) / 100 * 100) / 100;
  }

  static calculateTax(amount, taxRate = 0.1) {
    return Math.round(amount * taxRate * 100) / 100;
  }

  static validatePhoneNumber(phone) {
    // Zambia phone validation (260)
    const sanitized = phone.replace(/\D/g, '');
    return sanitized.length >= 10 && sanitized.length <= 13;
  }

  static parsePhoneNumber(phone) {
    const sanitized = phone.replace(/\D/g, '');
    if (sanitized.startsWith('260')) {
      return `+${sanitized}`;
    }
    return `+260${sanitized.slice(-10)}`;
  }
}

export default PaymentUtil;
