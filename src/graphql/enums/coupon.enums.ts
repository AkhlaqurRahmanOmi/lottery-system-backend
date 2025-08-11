import { registerEnumType } from '@nestjs/graphql';
import { CouponStatus, GenerationMethod } from '@prisma/client';

// Register CouponStatus enum with GraphQL
registerEnumType(CouponStatus, {
  name: 'CouponStatus',
  description: 'Coupon status enumeration',
});

// Register GenerationMethod enum with GraphQL
registerEnumType(GenerationMethod, {
  name: 'GenerationMethod',
  description: 'Coupon generation method enumeration',
});

export { CouponStatus, GenerationMethod };