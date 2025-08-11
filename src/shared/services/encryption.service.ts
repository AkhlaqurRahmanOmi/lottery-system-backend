import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly secretKey: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret-key-change-in-production';
    // Create a consistent key from the secret
    this.secretKey = crypto.scryptSync(secret, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      cipher.setAAD(Buffer.from('reward-credentials'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();
      
      // Combine iv, tag, and encrypted data
      const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, 'hex')]);
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const combined = Buffer.from(encryptedData, 'base64');
      
      // Extract iv, tag, and encrypted data
      const iv = combined.subarray(0, this.ivLength);
      const tag = combined.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.subarray(this.ivLength + this.tagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
      decipher.setAAD(Buffer.from('reward-credentials'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate a secure random string
   */
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}