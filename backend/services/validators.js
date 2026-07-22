export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const PHONE_REGEX = /^\+?[0-9 ()\-]{10,20}$/;

export function isValidPhone(value) {
  if (typeof value !== 'string' || !value.trim()) return true;
  const digits = value.replace(/[^0-9]/g, '');
  return digits.length === 10 && PHONE_REGEX.test(value);
}

export function phoneError(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!PHONE_REGEX.test(value)) return 'Enter a valid phone number';
  return null;
}
export const PASSWORD_MIN_LENGTH = 10;
export const NAME_MAX_LENGTH = 100;
export const COMPANY_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 5000;
export const PROMPT_MAX_LENGTH = 10000;
export const MESSAGE_MAX_LENGTH = 2000;
export const PASSWORD_REGEX = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  digit: /[0-9]/,
  symbol: /[^A-Za-z0-9]/,
};

export function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_REGEX.test(value);
}

export function isValidPassword(value) {
  if (typeof value !== 'string') return false;
  if (value.length < PASSWORD_MIN_LENGTH || value.length > 128) return false;
  if (!PASSWORD_REGEX.upper.test(value)) return false;
  if (!PASSWORD_REGEX.lower.test(value)) return false;
  if (!PASSWORD_REGEX.digit.test(value)) return false;
  if (!PASSWORD_REGEX.symbol.test(value)) return false;
  return true;
}

export function passwordError(value) {
  if (typeof value !== 'string') return 'Password is required';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (value.length > 128) return 'Password is too long';
  if (!PASSWORD_REGEX.upper.test(value)) return 'Password must include an uppercase letter';
  if (!PASSWORD_REGEX.lower.test(value)) return 'Password must include a lowercase letter';
  if (!PASSWORD_REGEX.digit.test(value)) return 'Password must include a digit';
  if (!PASSWORD_REGEX.symbol.test(value)) return 'Password must include a symbol';
  return null;
}

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().slice(0, 254);
}

export function trimString(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function safeInt(value, { min = 0, max = Number.MAX_SAFE_INTEGER, fallback = min } = {}) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function safeString(value, max = 1000, fallback = '') {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, max);
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parsePhoneWordsToDigits(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  
  const WORD_TO_DIGIT = {
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9'
  };

  let str = phone.trim().toLowerCase();
  
  for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    str = str.replace(regex, digit);
  }
  
  const hasWords = Object.keys(WORD_TO_DIGIT).some(w => str.includes(w));
  if (hasWords) {
    let temp = str;
    for (const [word, digit] of Object.entries(WORD_TO_DIGIT)) {
      temp = temp.replace(new RegExp(word, 'g'), digit);
    }
    str = temp;
  }

  const isInternationalPlus = str.trim().startsWith('+');
  const rawDigits = str.replace(/\D/g, '');

  if (rawDigits.length === 10) {
    return `+91${rawDigits}`;
  }
  if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
    return `+${rawDigits}`;
  }
  if (rawDigits.length === 11 && rawDigits.startsWith('0')) {
    return `+91${rawDigits.slice(1)}`;
  }
  if (isInternationalPlus && rawDigits.length >= 10) {
    return `+${rawDigits}`;
  }
  if (rawDigits.length >= 10) {
    return `+91${rawDigits.slice(-10)}`;
  }

  return phone;
}
