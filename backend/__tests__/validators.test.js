import { PHONE_REGEX } from '../services/utils/validators.js';

describe('PHONE_REGEX', () => {
  it('validates international phone numbers', () => {
    expect(PHONE_REGEX.test('+15551234567')).toBe(true);
    expect(PHONE_REGEX.test('+919876543210')).toBe(true);
    expect(PHONE_REGEX.test('15551234567')).toBe(true);
  });

  it('rejects invalid phone numbers', () => {
    expect(PHONE_REGEX.test('abc')).toBe(false);
    expect(PHONE_REGEX.test('123')).toBe(false);
    expect(PHONE_REGEX.test('')).toBe(false);
  });
});
