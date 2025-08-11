import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'sensitive-credential-data';
      
      const encrypted = service.encrypt(originalText);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should produce different encrypted values for the same input', () => {
      const text = 'test-data';
      
      const encrypted1 = service.encrypt(text);
      const encrypted2 = service.encrypt(text);
      
      expect(encrypted1).not.toBe(encrypted2);
      expect(service.decrypt(encrypted1)).toBe(text);
      expect(service.decrypt(encrypted2)).toBe(text);
    });

    it('should handle empty strings', () => {
      const encrypted = service.encrypt('');
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const specialText = 'user@example.com:P@ssw0rd!@#$%^&*()';
      const encrypted = service.encrypt(specialText);
      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(specialText);
    });

    it('should throw error for invalid encrypted data', () => {
      expect(() => service.decrypt('invalid-data')).toThrow();
    });
  });

  describe('hash', () => {
    it('should generate consistent hash for same input', () => {
      const text = 'test-data';
      const hash1 = service.hash(text);
      const hash2 = service.hash(text);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = service.hash('data1');
      const hash2 = service.hash('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSecureRandom', () => {
    it('should generate random strings of specified length', () => {
      const random1 = service.generateSecureRandom(16);
      const random2 = service.generateSecureRandom(16);
      
      expect(random1).toHaveLength(32); // hex encoding doubles the length
      expect(random2).toHaveLength(32);
      expect(random1).not.toBe(random2);
    });

    it('should generate different lengths correctly', () => {
      const short = service.generateSecureRandom(8);
      const long = service.generateSecureRandom(32);
      
      expect(short).toHaveLength(16);
      expect(long).toHaveLength(64);
    });
  });
});