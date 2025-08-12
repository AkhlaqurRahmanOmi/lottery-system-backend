import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  IsValidCouponCode,
  IsValidUserName,
  IsValidPhoneNumber,
  IsValidAddress,
  IsValidProductExperience,
  IsValidServiceName,
  IsValidBatchName,
  IsValidAdminUsername,
  IsSecurePassword,
  IsSafeText,
} from './validation.decorators';

// Test DTOs
class CouponCodeTestDto {
  @IsValidCouponCode()
  couponCode: string;
}

class UserNameTestDto {
  @IsValidUserName()
  name: string;
}

class PhoneNumberTestDto {
  @IsValidPhoneNumber()
  phone: string;
}

class AddressTestDto {
  @IsValidAddress()
  address: string;
}

class ProductExperienceTestDto {
  @IsValidProductExperience()
  experience: string;
}

class ServiceNameTestDto {
  @IsValidServiceName()
  serviceName: string;
}

class BatchNameTestDto {
  @IsValidBatchName()
  batchName?: string;
}

class AdminUsernameTestDto {
  @IsValidAdminUsername()
  username: string;
}

class SecurePasswordTestDto {
  @IsSecurePassword()
  password: string;
}

class SafeTextTestDto {
  @IsSafeText()
  text: string;
}

describe('Validation Decorators', () => {
  describe('IsValidCouponCode', () => {
    it('should validate correct coupon codes', async () => {
      const dto = plainToClass(CouponCodeTestDto, { couponCode: 'ABC123XYZ9' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject codes with ambiguous characters', async () => {
      const dto = plainToClass(CouponCodeTestDto, { couponCode: 'ABC0O1IL' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject codes that are too short', async () => {
      const dto = plainToClass(CouponCodeTestDto, { couponCode: 'ABC123' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject codes that are too long', async () => {
      const dto = plainToClass(CouponCodeTestDto, { couponCode: 'ABC123XYZ9TOOLONG' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject codes with invalid characters', async () => {
      const dto = plainToClass(CouponCodeTestDto, { couponCode: 'ABC-123' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidUserName', () => {
    it('should validate normal names', async () => {
      const dto = plainToClass(UserNameTestDto, { name: 'John Doe' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate international names', async () => {
      const dto = plainToClass(UserNameTestDto, { name: 'José María' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject names with XSS patterns', async () => {
      const dto = plainToClass(UserNameTestDto, { name: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject names that are too short', async () => {
      const dto = plainToClass(UserNameTestDto, { name: 'A' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject names with multiple consecutive spaces', async () => {
      const dto = plainToClass(UserNameTestDto, { name: 'John  Doe' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidPhoneNumber', () => {
    it('should validate US phone numbers', async () => {
      const dto = plainToClass(PhoneNumberTestDto, { phone: '+1-555-123-4567' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate international phone numbers', async () => {
      const dto = plainToClass(PhoneNumberTestDto, { phone: '+44-20-7946-0958' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate simple digit format', async () => {
      const dto = plainToClass(PhoneNumberTestDto, { phone: '5551234567' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject phone numbers that are too short', async () => {
      const dto = plainToClass(PhoneNumberTestDto, { phone: '123456' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject phone numbers with XSS patterns', async () => {
      const dto = plainToClass(PhoneNumberTestDto, { phone: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidAddress', () => {
    it('should validate normal addresses', async () => {
      const dto = plainToClass(AddressTestDto, { address: '123 Main St, Anytown, ST 12345' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate international addresses', async () => {
      const dto = plainToClass(AddressTestDto, { address: '10 Downing Street, London SW1A 2AA, UK' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject addresses that are too short', async () => {
      const dto = plainToClass(AddressTestDto, { address: '123 Main' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject addresses with XSS patterns', async () => {
      const dto = plainToClass(AddressTestDto, { address: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidProductExperience', () => {
    it('should validate meaningful product experience', async () => {
      const experience = 'I have been using this product for 6 months and found it very helpful for my daily tasks.';
      const dto = plainToClass(ProductExperienceTestDto, { experience });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject experience that is too short', async () => {
      const dto = plainToClass(ProductExperienceTestDto, { experience: 'Good' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject experience with XSS patterns', async () => {
      const experience = '<script>alert("xss")</script>This product is great!';
      const dto = plainToClass(ProductExperienceTestDto, { experience });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject experience with only punctuation', async () => {
      const dto = plainToClass(ProductExperienceTestDto, { experience: '!!!!!!!!!!!!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidServiceName', () => {
    it('should validate known service names', async () => {
      const dto = plainToClass(ServiceNameTestDto, { serviceName: 'netflix' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate custom service names', async () => {
      const dto = plainToClass(ServiceNameTestDto, { serviceName: 'Custom Streaming Service' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject service names with XSS patterns', async () => {
      const dto = plainToClass(ServiceNameTestDto, { serviceName: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject service names that are too short', async () => {
      const dto = plainToClass(ServiceNameTestDto, { serviceName: 'A' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidBatchName', () => {
    it('should validate normal batch names', async () => {
      const dto = plainToClass(BatchNameTestDto, { batchName: 'Summer Campaign 2024' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow undefined batch names (optional)', async () => {
      const dto = plainToClass(BatchNameTestDto, {});
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject batch names with XSS patterns', async () => {
      const dto = plainToClass(BatchNameTestDto, { batchName: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject batch names that are too short', async () => {
      const dto = plainToClass(BatchNameTestDto, { batchName: 'AB' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsValidAdminUsername', () => {
    it('should validate normal admin usernames', async () => {
      const dto = plainToClass(AdminUsernameTestDto, { username: 'admin_user' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate usernames with hyphens', async () => {
      const dto = plainToClass(AdminUsernameTestDto, { username: 'admin-user' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject usernames that don\'t start with a letter', async () => {
      const dto = plainToClass(AdminUsernameTestDto, { username: '123admin' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject usernames with spaces', async () => {
      const dto = plainToClass(AdminUsernameTestDto, { username: 'admin user' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject usernames with SQL injection patterns', async () => {
      const dto = plainToClass(AdminUsernameTestDto, { username: 'admin; DROP TABLE users' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsSecurePassword', () => {
    it('should validate secure passwords', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'MySecure123!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject passwords without uppercase', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'mysecure123!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject passwords without lowercase', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'MYSECURE123!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject passwords without numbers', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'MySecurePass!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject passwords without special characters', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'MySecure123' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject weak passwords', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'Password123!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject passwords that are too short', async () => {
      const dto = plainToClass(SecurePasswordTestDto, { password: 'Sec1!' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });

  describe('IsSafeText', () => {
    it('should validate safe text', async () => {
      const dto = plainToClass(SafeTextTestDto, { text: 'This is safe text content.' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject text with script tags', async () => {
      const dto = plainToClass(SafeTextTestDto, { text: '<script>alert("xss")</script>' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject text with JavaScript protocols', async () => {
      const dto = plainToClass(SafeTextTestDto, { text: 'javascript:alert("xss")' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject text with event handlers', async () => {
      const dto = plainToClass(SafeTextTestDto, { text: 'onclick=alert("xss")' });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });

    it('should reject text with multiple SQL injection patterns', async () => {
      const dto = plainToClass(SafeTextTestDto, { text: "'; DROP TABLE users; SELECT * FROM passwords; --" });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
    });
  });
});