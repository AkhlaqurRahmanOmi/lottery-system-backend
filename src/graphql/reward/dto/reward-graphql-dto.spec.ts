import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateRewardGraphQLInputDto,
  UpdateRewardGraphQLInputDto,
  RewardQueryGraphQLInputDto,
  BulkRewardOperationGraphQLInputDto,
  RewardOrderingGraphQLInputDto,
  RewardOrderItemInput,
  RewardSelectionValidationGraphQLInputDto
} from './reward-management-graphql.dto';

describe('Reward GraphQL DTOs', () => {
  describe('CreateRewardGraphQLInputDto', () => {
    it('should validate a valid reward creation input', async () => {
      const dto = plainToClass(CreateRewardGraphQLInputDto, {
        name: 'Test Reward',
        description: 'A test reward',
        imageUrl: 'https://example.com/image.jpg',
        displayOrder: 1,
        isActive: true
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when name is missing', async () => {
      const dto = plainToClass(CreateRewardGraphQLInputDto, {
        description: 'A test reward'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation when name is too long', async () => {
      const dto = plainToClass(CreateRewardGraphQLInputDto, {
        name: 'A'.repeat(256), // Exceeds 255 character limit
        description: 'A test reward'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('UpdateRewardGraphQLInputDto', () => {
    it('should validate a valid reward update input', async () => {
      const dto = plainToClass(UpdateRewardGraphQLInputDto, {
        name: 'Updated Reward',
        isActive: false
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate an empty update input', async () => {
      const dto = plainToClass(UpdateRewardGraphQLInputDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('RewardQueryGraphQLInputDto', () => {
    it('should validate a valid query input', async () => {
      const dto = plainToClass(RewardQueryGraphQLInputDto, {
        page: 1,
        limit: 10,
        search: 'gift card',
        isActive: true,
        sortBy: 'name',
        sortOrder: 'asc'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should use default values when not provided', async () => {
      const dto = plainToClass(RewardQueryGraphQLInputDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.sortBy).toBe('displayOrder');
      expect(dto.sortOrder).toBe('asc');
    });
  });

  describe('BulkRewardOperationGraphQLInputDto', () => {
    it('should validate a valid bulk operation input', async () => {
      const dto = plainToClass(BulkRewardOperationGraphQLInputDto, {
        rewardIds: [1, 2, 3],
        operation: 'activate'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when rewardIds is empty', async () => {
      const dto = plainToClass(BulkRewardOperationGraphQLInputDto, {
        rewardIds: [],
        operation: 'activate'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when operation is invalid', async () => {
      const dto = plainToClass(BulkRewardOperationGraphQLInputDto, {
        rewardIds: [1, 2, 3],
        operation: 'invalid'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RewardOrderingGraphQLInputDto', () => {
    it('should validate a valid ordering input', async () => {
      const dto = plainToClass(RewardOrderingGraphQLInputDto, {
        rewards: [
          { id: 1, displayOrder: 1 },
          { id: 2, displayOrder: 2 }
        ]
      }, { enableImplicitConversion: true });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when rewards array is empty', async () => {
      const dto = plainToClass(RewardOrderingGraphQLInputDto, {
        rewards: []
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RewardOrderItemInput', () => {
    it('should validate a valid order item input', async () => {
      const dto = plainToClass(RewardOrderItemInput, {
        id: 1,
        displayOrder: 1
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id is not a number', async () => {
      const dto = plainToClass(RewardOrderItemInput, {
        id: 'invalid',
        displayOrder: 1
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RewardSelectionValidationGraphQLInputDto', () => {
    it('should validate a valid selection validation input', async () => {
      const dto = plainToClass(RewardSelectionValidationGraphQLInputDto, {
        rewardId: 1
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});