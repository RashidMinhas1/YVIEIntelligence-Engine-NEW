/**
 * Encrypted API Key Service
 * Provides AES-256-GCM encryption and decryption for sensitive API keys.
 * Ensures API keys are never stored as plain text.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_KEY = 'universal-ai-provider-ecosystem-secret-key-2026';

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export class CryptoService {
  /**
   * Encrypt a plain text API key string.
   */
  public static encrypt(text: string): EncryptedData {
    if (!text) return { encrypted: '', iv: '', tag: '' };
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  /**
   * Decrypt an encrypted API key structure back to plain text.
   */
  public static decrypt(data: EncryptedData): string {
    if (!data || !data.encrypted || !data.iv || !data.tag) return '';
    try {
      const key = getEncryptionKey();
      const iv = Buffer.from(data.iv, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('[CryptoService] Decryption failed:', error);
      return '';
    }
  }

  /**
   * Mask an API key for safe UI display (e.g. "sk-abc...1234")
   */
  public static maskKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '****';
    const prefix = key.slice(0, 4);
    const suffix = key.slice(-4);
    return `${prefix}...${suffix}`;
  }
}
