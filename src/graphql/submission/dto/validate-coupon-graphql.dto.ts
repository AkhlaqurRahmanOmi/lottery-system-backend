import { InputType, ObjectType } from '@nestjs/graphql';
import { ValidateCouponDto, CouponValidationResponseDto } from '../../../modules/submission/dto';

/**
 * GraphQL Input DTO for coupon validation requests
 * Inherits validation from base ValidateCouponDto
 */
@InputType('ValidateCouponInput')
export class ValidateCouponGraphQLDto extends ValidateCouponDto {
  // GraphQL-specific customizations can be added here if needed
}

/**
 * GraphQL Object DTO for coupon validation responses
 * Inherits structure from base CouponValidationResponseDto
 */
@ObjectType('CouponValidationResponse')
export class CouponValidationGraphQLResponseDto extends CouponValidationResponseDto {
  // GraphQL-specific customizations can be added here if needed
}