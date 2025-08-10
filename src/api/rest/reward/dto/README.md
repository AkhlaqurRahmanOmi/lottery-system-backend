# Reward REST DTOs

This directory contains REST API-specific Data Transfer Objects (DTOs) for the reward management system.

## Structure

### Management DTOs (`reward-management-rest.dto.ts`)
- `CreateRewardRestDto` - DTO for creating new rewards with enhanced REST documentation
- `UpdateRewardRestDto` - DTO for updating existing rewards
- `RewardQueryRestDto` - DTO for querying rewards with pagination and filtering
- `BulkRewardOperationRestDto` - DTO for bulk operations on multiple rewards
- `RewardOrderingRestDto` - DTO for updating reward display order

### Response DTOs (`reward-response-rest.dto.ts`)
- `RestSuccessResponseDto<T>` - Generic success response wrapper
- `RewardRestResponseDto` - Single reward response
- `CreateRewardRestResponseDto` - Reward creation response
- `UpdateRewardRestResponseDto` - Reward update response
- `RewardQueryRestResponseDto` - Paginated reward query response
- `BulkRewardOperationRestResponseDto` - Bulk operation response
- `RewardOrderingRestResponseDto` - Reward ordering response
- `DeleteRewardRestResponseDto` - Reward deletion response
- `RewardStatisticsRestResponseDto` - Reward statistics response
- `RestErrorResponseDto` - Error response format

### Public DTOs (`public-reward-rest.dto.ts`)
- `PublicRewardDto` - Public-facing reward data (excludes admin info)
- `PublicActiveRewardsResponseDto` - Response for active rewards list
- `RewardSelectionValidationDto` - DTO for validating reward selection
- `RewardSelectionValidationResponseDto` - Validation response
- `PublicRewardPopularityDto` - Public reward popularity statistics
- `PublicRewardPopularityResponseDto` - Popularity statistics response

## Usage

### Admin Operations
```typescript
// Creating a reward
const createDto: CreateRewardRestDto = {
  name: 'Premium Gift Card',
  description: 'A premium gift card worth $100',
  imageUrl: 'https://example.com/images/gift-card.jpg',
  displayOrder: 1,
  isActive: true
};

// Bulk operations
const bulkDto: BulkRewardOperationRestDto = {
  rewardIds: [1, 2, 3],
  operation: 'activate'
};
```

### Public Operations
```typescript
// Validating reward selection
const validationDto: RewardSelectionValidationDto = {
  rewardId: 1
};
```

## Response Format

All REST responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["Name is required"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/admin/rewards"
}
```

## Validation

All DTOs include comprehensive validation using class-validator decorators:
- Required field validation
- String length limits
- URL format validation
- Enum value validation
- Custom business rule validation

## Documentation

All DTOs are fully documented with Swagger/OpenAPI decorators for automatic API documentation generation.