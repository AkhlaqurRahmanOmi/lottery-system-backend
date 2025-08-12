// Validation Module
export { ValidationModule } from './validation.module';

// Services
export { InputSanitizationService } from '../services/input-sanitization.service';
export { SqlInjectionPreventionService } from '../services/sql-injection-prevention.service';

// Pipes
export { EnhancedValidationPipe, EnhancedValidationError } from '../pipes/enhanced-validation.pipe';

// Guards
export { 
  InputValidationGuard, 
  ValidationConfig as ValidationConfigDecorator,
  ValidateInput,
  type ValidationConfig 
} from '../guards/input-validation.guard';

export { 
  RateLimitingGuard,
  RateLimit,
  AuthRateLimit,
  SubmissionRateLimit,
  AdminRateLimit,
  ReadOnlyRateLimit,
  DefaultRateLimit,
  type RateLimitConfig 
} from '../guards/rate-limiting.guard';

// Middleware
export { SecurityHeadersMiddleware } from '../middleware/security-headers.middleware';

// Custom Validation Decorators
export {
  // Existing decorators
  IsPositivePrice,
  IsValidCategory,
  IsValidProductName,
  IsValidDescription,
  IsValidPage,
  IsValidLimit,
  IsValidSortField,
  IsValidSortOrder,
  
  // New lottery system decorators
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
} from '../decorators/validation.decorators';