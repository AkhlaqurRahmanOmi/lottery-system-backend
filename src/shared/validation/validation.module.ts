import { Module, Global } from '@nestjs/common';
import { InputSanitizationService } from '../services/input-sanitization.service';
import { SqlInjectionPreventionService } from '../services/sql-injection-prevention.service';
import { EnhancedValidationPipe } from '../pipes/enhanced-validation.pipe';
import { InputValidationGuard } from '../guards/input-validation.guard';
import { RateLimitingGuard } from '../guards/rate-limiting.guard';

/**
 * Global validation module that provides comprehensive input validation,
 * sanitization, and security services
 * Requirements: 10.2, 10.3, 10.4, 10.6
 */
@Global()
@Module({
  providers: [
    InputSanitizationService,
    SqlInjectionPreventionService,
    EnhancedValidationPipe,
    InputValidationGuard,
    RateLimitingGuard,
  ],
  exports: [
    InputSanitizationService,
    SqlInjectionPreventionService,
    EnhancedValidationPipe,
    InputValidationGuard,
    RateLimitingGuard,
  ],
})
export class ValidationModule {}