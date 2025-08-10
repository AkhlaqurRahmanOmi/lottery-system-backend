# Coupon GraphQL Resolver

This module provides GraphQL operations for the coupon management system, including queries, mutations, and real-time subscriptions.

## Features

### Queries
- `coupon(id: Int!)` - Get coupon by ID with creator and submission details
- `couponByCode(couponCode: String!)` - Get coupon by code with creator and submission details
- `coupons(query: CouponQueryInput)` - Get paginated list of coupons with filters
- `validateCoupon(couponCode: String!)` - Validate coupon code for redemption (public endpoint)
- `batchStatistics(batchId: String!)` - Get statistics for a specific batch
- `allBatchStatistics` - Get statistics for all batches
- `couponStatistics` - Get overall coupon system statistics

### Mutations
- `generateCoupons(input: GenerateCouponsInput!)` - Generate single or multiple coupon codes
- `redeemCoupon(couponCode: String!, redeemedBy: Int)` - Redeem a coupon code (public endpoint)
- `updateCoupon(id: Int!, input: UpdateCouponStatusInput!)` - Update coupon status
- `deactivateCoupon(id: Int!)` - Deactivate a coupon
- `deactivateBatch(batchId: String!)` - Deactivate entire batch of coupons
- `expireExpiredCoupons` - Manually expire expired coupons

### Subscriptions
- `couponUpdated(batchId: String)` - Subscribe to coupon updates (generated, redeemed, expired, deactivated)
- `batchUpdated` - Subscribe to batch updates (created, deactivated, statistics updated)
- `couponStatisticsUpdated` - Subscribe to coupon statistics updates

## Authentication

Most operations require admin authentication using JWT tokens. Public endpoints include:
- `validateCoupon` - For users to validate coupon codes
- `redeemCoupon` - For users to redeem coupon codes

## Input Types

### GenerateCouponsInput
```graphql
input GenerateCouponsInput {
  quantity: Int! # 1-1000
  codeLength: Int # 8-12 characters, default: 10
  expirationDays: Int # 1-365 days
  batchName: String
  createdBy: Int!
  metadata: JSON
}
```

### CouponQueryInput
```graphql
input CouponQueryInput {
  page: Int # Default: 1
  limit: Int # 1-100, default: 10
  search: String
  status: CouponStatus
  batchId: String
  generationMethod: GenerationMethod
  createdBy: Int
  createdFrom: String # ISO date
  createdTo: String # ISO date
  expiresFrom: String # ISO date
  expiresTo: String # ISO date
  sortBy: String # Default: "createdAt"
  sortOrder: String # "asc" or "desc", default: "desc"
}
```

### UpdateCouponStatusInput
```graphql
input UpdateCouponStatusInput {
  couponCode: String!
  status: String! # "ACTIVE" or "DEACTIVATED"
}
```

## Response Types

### CouponResponse
```graphql
type CouponResponse {
  id: Int!
  couponCode: String!
  batchId: String
  codeLength: Int!
  status: CouponStatus!
  createdBy: Int!
  createdAt: DateTime!
  expiresAt: DateTime
  redeemedAt: DateTime
  redeemedBy: Int
  generationMethod: GenerationMethod!
  metadata: JSON
}
```

### GenerateCouponsResponse
```graphql
type GenerateCouponsResponse {
  success: Boolean!
  message: String
  errors: [String!]
  coupons: [CouponResponse!]
  totalGenerated: Int
  batchId: String
}
```

## Real-time Updates

The resolver publishes real-time updates for:
- Coupon generation, redemption, deactivation
- Batch operations
- Statistics changes

Clients can subscribe to these events for live dashboard updates.

## Error Handling

All mutations return structured responses with:
- `success: Boolean` - Operation success status
- `message: String` - Human-readable message
- `errors: [String]` - Array of error messages if operation failed

## Usage Examples

### Generate Coupons
```graphql
mutation GenerateCoupons {
  generateCoupons(input: {
    quantity: 10
    codeLength: 10
    expirationDays: 30
    batchName: "Campaign 2025"
    createdBy: 1
  }) {
    success
    message
    totalGenerated
    batchId
    coupons {
      id
      couponCode
      status
      createdAt
    }
  }
}
```

### Validate Coupon (Public)
```graphql
query ValidateCoupon {
  validateCoupon(couponCode: "ABC123XYZ9") {
    isValid
    error
    coupon {
      id
      couponCode
      status
      expiresAt
    }
  }
}
```

### Subscribe to Updates
```graphql
subscription CouponUpdates {
  couponUpdated {
    type
    coupon {
      id
      couponCode
      status
    }
    timestamp
    batchId
  }
}
```

## Testing

The resolver includes comprehensive unit tests covering:
- All query operations
- All mutation operations
- Error handling scenarios
- Authentication requirements

Run tests with:
```bash
npm test -- --testPathPattern=coupon.resolver.spec.ts
```