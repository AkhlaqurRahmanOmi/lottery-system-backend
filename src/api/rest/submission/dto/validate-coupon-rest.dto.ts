import { ValidateCouponDto, CouponValidationResponseDto } from '../../../../modules/submission/dto';

/**
 * REST API DTO for coupon validation requests
 * Inherits validation from base ValidateCouponDto
 */
export class ValidateCouponRestDto extends ValidateCouponDto {
  // REST-specific customizations can be added here if needed
}

/**
 * REST API DTO for coupon validation responses
 * Inherits structure from base CouponValidationResponseDto
 */
export class CouponValidationRestResponseDto extends CouponValidationResponseDto {
  // REST-specific customizations can be added here if needed
}