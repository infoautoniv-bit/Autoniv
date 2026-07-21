import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'autoniv-default-encryption-secret-key-32chars')
  .digest(); // Generates exactly 32 bytes

export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText; // Fallback for plain text
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // If decryption fails, return original text as fallback
    return encryptedText;
  }
}

// Encrypt every string value in a credentials-style object (carrier secrets:
// auth tokens, API keys, account SIDs). Non-string values pass through
// untouched. Empty strings are left as-is so blank fields stay blank. Safe to
// call on an object that is already encrypted only if you avoid double-calling;
// callers encrypt once on write.
export function encryptCredentials(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' && v.length > 0 ? encrypt(v) : v;
  }
  return out;
}

// Inverse of encryptCredentials. decrypt() falls back to returning the input
// unchanged when it is not our `iv:ciphertext` format, so legacy plaintext
// records decrypt cleanly to themselves.
export function decryptCredentials(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' && v.length > 0 ? decrypt(v) : v;
  }
  return out;
}

export default {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
};
