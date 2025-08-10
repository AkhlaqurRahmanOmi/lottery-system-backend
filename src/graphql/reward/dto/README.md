# Reward GraphQL DTOs

This directory contains GraphQL-specific Data Transfer Objects (DTOs) for the reward management system.

## Structure

### Management DTOs (`reward-management-graphql.dto.ts`)
- `CreateRewardGraphQLInputDto` - Input for creating new rewards
- `UpdateRewardGraphQLInputDto` - Input for updating existing rewards
- `RewardQueryGraphQLInputDto` - Input for querying rewards with pagination and filtering
- `BulkRewardOperationGraphQLInputDto` - Input for bulk operations on multiple rewards
- `RewardOrderingGraphQLInputDto` - Input for updating reward display order
- `RewardOrderItemInput` - Individual reward order item
- `RewardSelectionValidationGraphQLInputDto` - Input for reward selection validation

### Response DTOs (`reward-response-graphql.dto.ts`)
- `RewardMutationResponseDto` - Base mutation response with success/error info
- `CreateRewardGraphQLResponseDto` - Reward creation response
- `UpdateRewardGraphQLResponseDto` - Reward update response
- `DeleteRewardGraphQLResponseDto` - Reward deletion response
- `BulkRewardOperationGraphQLResponseDto` - Bulk operation response
- `RewardOrderingGraphQLResponseDto` - Reward ordering response
- `RewardSelectionValidationGraphQLResponseDto` - Selection validation response
- `RewardStatisticsGraphQLResponseDto` - Reward statistics response
- `RewardPopularityItem` - Individual reward popularity data
- `RewardPopularityGraphQLResponseDto` - Popularity statistics response
- `RewardUpdatePayloadDto` - Subscription payload for reward updates
- `RewardStatisticsUpdatePayloadDto` - Subscription payload for statistics updates

### Public DTOs (`public-reward-graphql.dto.ts`)
- `PublicRewardGraphQLDto` - Public-facing reward data (excludes admin info)
- `ActiveRewardsGraphQLResponseDto` - Response for active rewards query
- `PublicRewardSelectionValidationGraphQLResponseDto` - Public validation response
- `PublicRewardPopularityGraphQLDto` - Public reward popularity data
- `PublicRewardPopularityGraphQLResponseDto` - Public popularity response
- `PublicRewardUpdatePayloadDto` - Subscription payload for public reward updates
- `RewardAvailabilityUpdatePayloadDto` - Subscription payload for availability changes

## Usage

### Admin Operations
```graphql
# Creating a reward
mutation CreateReward($input: CreateRewardGraphQLInput!) {
  createReward(input: $input) {
    success
    message
    reward {
      id
      name
      description
      isActive
    }
  }
}

# Bulk operations
mutation BulkRewardOperation($input: BulkRewardOperationInput!) {
  bulkRewardOperation(input: $input) {
    success
    message
    affectedCount
    details
  }
}
```

### Public Operations
```graphql
# Query active rewards
query ActiveRewards {
  activeRewards {
    rewards {
      id
      name
      description
      imageUrl
      displayOrder
    }
    totalCount
  }
}

# Validate reward selection
query ValidateRewardSelection($rewardId: Int!) {
  validateRewardSelection(rewardId: $rewardId) {
    isValid
    reward {
      id
      name
      description
    }
    error
  }
}
```

### Subscriptions
```graphql
# Subscribe to reward updates
subscription RewardUpdates {
  rewardUpdated {
    type
    reward {
      id
      name
      isActive
    }
    timestamp
    updatedBy
  }
}

# Subscribe to public reward availability changes
subscription RewardAvailabilityUpdates {
  rewardAvailabilityChanged {
    type
    availableRewards {
      id
      name
      description
    }
    timestamp
  }
}
```

## Response Patterns

### Mutation Responses
All mutations return a base response with success status and optional data:
```typescript
{
  success: boolean;
  message?: string;
  errors?: string[];
  // Additional specific data fields
}
```

### Query Responses
Queries return data directly or wrapped in response objects for complex operations.

### Subscription Payloads
Subscriptions provide real-time updates with:
- Update type identifier
- Updated data
- Timestamp
- Additional context (e.g., who made the update)

## Validation

All input DTOs include:
- GraphQL field validation
- Type safety through TypeScript
- Custom validation decorators from class-validator
- Proper nullable/optional field handling

## Documentation

All DTOs include comprehensive GraphQL field descriptions for automatic schema documentation generation.