import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const raw = process.env.AGENCY_VAULT_KEY;
  if (raw && raw.length >= 32) {
    // Derive a deterministic 32-byte key from the configured secret
    return crypto.createHash('sha256').update(raw).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AGENCY_VAULT_KEY environment variable is required in production.');
  }
  // Local development fallback key
  return crypto
    .createHash('sha256')
    .update('agencycore-local-dev-vault-key-do-not-use-in-prod')
    .digest();
}

export interface EncryptedPayload {
  encrypted_secret: string;
  iv: string;
  auth_tag: string;
}

export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted_secret: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: authTag.toString('base64'),
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.auth_tag, 'base64');
  const ciphertext = Buffer.from(payload.encrypted_secret, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function maskSecret(length = 12): string {
  return '•'.repeat(length);
}
