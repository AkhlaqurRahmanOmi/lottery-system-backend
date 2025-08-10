import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  CreateRewardRestDto,
  UpdateRewardRestDto,
  RewardQueryRestDto,
  BulkRewardOperationRestDto,
  RewardOrderingRestDto,
  RewardOrderItemRestDto
} from './reward-management-rest.dto';
import {
  PublicRewardDto,
  RewardSelectionValidationDto
} from './public-reward-rest.dto';

describe('Reward REST DTOs', () => {
  describe('CreateRewardRestDto', () => {
    it('should validate a valid reward creation DTO', async () => {
      const dto = plainToClass(CreateRewardRestDto, {
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
      const dto = plainToClass(CreateRewardRestDto, {
        description: 'A test reward'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation when name is too long', async () => {
      const dto = plainToClass(CreateRewardRestDto, {
        name: 'A'.repeat(256), // Exceeds 255 character limit
        description: 'A test reward'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation when imageUrl is invalid', async () => {
      const dto = plainToClass(CreateRewardRestDto, {
        name: 'Test Reward',
        imageUrl: 'not-a-valid-url'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('imageUrl');
    });
  });

  describe('UpdateRewardRestDto', () => {
    it('should validate a valid reward update DTO', async () => {
      const dto = plainToClass(UpdateRewardRestDto, {
        name: 'Updated Reward',
        isActive: false
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate an empty update DTO', async () => {
      const dto = plainToClass(UpdateRewardRestDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('RewardQueryRestDto', () => {
    it('should validate a valid query DTO', async () => {
      const dto = plainToClass(RewardQueryRestDto, {
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

    it('should fail validation when page is less than 1', async () => {
      const dto = plainToClass(RewardQueryRestDto, {
        page: 0
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should fail validation when limit exceeds maximum', async () => {
      const dto = plainToClass(RewardQueryRestDto, {
        limit: 101
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('BulkRewardOperationRestDto', () => {
    it('should validate a valid bulk operation DTO', async () => {
      const dto = plainToClass(BulkRewardOperationRestDto, {
        rewardIds: [1, 2, 3],
        operation: 'activate'
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when rewardIds is empty', async () => {
      const dto = plainToClass(BulkRewardOperationRestDto, {
        rewardIds: [],
        operation: 'activate'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when operation is invalid', async () => {
      const dto = plainToClass(BulkRewardOperationRestDto, {
        rewardIds: [1, 2, 3],
        operation: 'invalid'
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('RewardOrderingRestDto', () => {
    it('should validate a valid ordering DTO', async () => {
      const dto = plainToClass(RewardOrderingRestDto, {
        rewards: [
          { id: 1, displayOrder: 1 },
          { id: 2, displayOrder: 2 }
        ]
      }, { enableImplicitConversion: true });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when rewards array is empty', async () => {
      const dto = plainToClass(RewardOrderingRestDto, {
        rewards: []
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('PublicRewardDto', () => {
    it('should create a valid public reward DTO', () => {
      const dto: PublicRewardDto = {
        id: 1,
        name: 'Test Reward',
        description: 'A test reward',
        imageUrl: 'https://example.com/image.jpg',
        displayOrder: 1
      };

      expect(dto.id).toBe(1);
      expect(dto.name).toBe('Test Reward');
      expect(dto.displayOrder).toBe(1);
    });
  });

  describe('RewardSelectionValidationDto', () => {
    it('should validate a valid selection validation DTO', async () => {
      const dto = plainToClass(RewardSelectionValidationDto, {
        rewardId: 1
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});