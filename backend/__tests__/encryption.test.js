import { encrypt, decrypt } from '../services/encryption.js';

describe('encryption', () => {
  it('encrypts and decrypts a string roundtrip', () => {
    const original = 'super-secret-api-key-12345';
    const encrypted = encrypt(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted).toContain(':');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('returns plaintext if decryption fails', () => {
    const plaintext = 'not-encrypted';
    const result = decrypt(plaintext);
    expect(result).toBe(plaintext);
  });

  it('produces different ciphertext for different inputs', () => {
    const a = encrypt('hello');
    const b = encrypt('world');
    expect(a).not.toBe(b);
  });
});
