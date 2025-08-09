import { Test, TestingModule } from '@nestjs/testing';
import { PubsubService } from './pubsub.service';

// Mock the PubSub class
const mockPubSub = {
  publish: jest.fn(),
  asyncIterableIterator: jest.fn(),
  close: jest.fn(),
};

jest.mock('graphql-subscriptions', () => ({
  PubSub: jest.fn().mockImplementation(() => mockPubSub),
}));

describe('PubsubService', () => {
  let service: PubsubService;

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PubsubService],
    }).compile();

    service = module.get<PubsubService>(PubsubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create PubSub instance on construction', () => {
    const { PubSub } = require('graphql-subscriptions');
    expect(PubSub).toHaveBeenCalled();
  });

  describe('publish', () => {
    it('should publish payload with correct trigger format', async () => {
      const trigger = 'productCreated';
      const payload = { id: 1, name: 'Test Product' };

      mockPubSub.publish.mockResolvedValue(undefined);

      await service.publish(trigger, payload);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
    });

    it('should handle string payload', async () => {
      const trigger = 'userNotification';
      const payload = 'Hello World';

      mockPubSub.publish.mockResolvedValue(undefined);

      await service.publish(trigger, payload);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
    });

    it('should handle number payload', async () => {
      const trigger = 'countUpdated';
      const payload = 42;

      mockPubSub.publish.mockResolvedValue(undefined);

      await service.publish(trigger, payload);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
    });

    it('should handle null payload', async () => {
      const trigger = 'itemDeleted';
      const payload = null;

      mockPubSub.publish.mockResolvedValue(undefined);

      await service.publish(trigger, payload);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
    });

    it('should handle complex object payload', async () => {
      const trigger = 'orderUpdated';
      const payload = {
        id: 1,
        status: 'shipped',
        items: [
          { id: 1, name: 'Product 1', quantity: 2 },
          { id: 2, name: 'Product 2', quantity: 1 },
        ],
        metadata: {
          timestamp: new Date(),
          userId: 123,
        },
      };

      mockPubSub.publish.mockResolvedValue(undefined);

      await service.publish(trigger, payload);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
    });

    it('should propagate errors from PubSub.publish', async () => {
      const trigger = 'errorTest';
      const payload = { test: 'data' };
      const error = new Error('Publish failed');

      mockPubSub.publish.mockRejectedValue(error);

      await expect(service.publish(trigger, payload)).rejects.toThrow('Publish failed');
    });
  });

  describe('asyncIterator', () => {
    it('should return async iterator for single trigger', () => {
      const trigger = 'productCreated';
      const mockIterator = {} as AsyncIterator<any>;

      mockPubSub.asyncIterableIterator.mockReturnValue(mockIterator);

      const result = service.asyncIterator(trigger);

      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledWith(trigger);
      expect(result).toBe(mockIterator);
    });

    it('should return async iterator for multiple triggers', () => {
      const triggers = ['productCreated', 'productUpdated', 'productDeleted'];
      const mockIterator = {} as AsyncIterator<any>;

      mockPubSub.asyncIterableIterator.mockReturnValue(mockIterator);

      const result = service.asyncIterator(triggers);

      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledWith(triggers);
      expect(result).toBe(mockIterator);
    });

    it('should handle empty array of triggers', () => {
      const triggers: string[] = [];
      const mockIterator = {} as AsyncIterator<any>;

      mockPubSub.asyncIterableIterator.mockReturnValue(mockIterator);

      const result = service.asyncIterator(triggers);

      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledWith(triggers);
      expect(result).toBe(mockIterator);
    });
  });

  describe('onModuleDestroy', () => {
    it('should call close method when it exists', async () => {
      mockPubSub.close = jest.fn().mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockPubSub.close).toHaveBeenCalledTimes(1);
    });

    it('should handle PubSub without close method gracefully', async () => {
      // Remove the close method from the mock
      delete (mockPubSub as any).close;

      const result = await service.onModuleDestroy();

      expect(result).toBeUndefined();
    });

    it('should handle close method that returns a promise', async () => {
      const closePromise = Promise.resolve('closed');
      mockPubSub.close = jest.fn().mockReturnValue(closePromise);

      const result = await service.onModuleDestroy();

      expect(mockPubSub.close).toHaveBeenCalledTimes(1);
      expect(result).toBe('closed');
    });

    it('should handle close method that throws an error', async () => {
      const error = new Error('Close failed');
      mockPubSub.close = jest.fn().mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow('Close failed');
    });
  });

  describe('integration scenarios', () => {
    it('should support publish-subscribe workflow', async () => {
      const trigger = 'testEvent';
      const payload = { message: 'test' };
      const mockIterator = {
        next: jest.fn(),
        return: jest.fn(),
        throw: jest.fn(),
      } as any;

      mockPubSub.publish.mockResolvedValue(undefined);
      mockPubSub.asyncIterableIterator.mockReturnValue(mockIterator);

      // Publish an event
      await service.publish(trigger, payload);

      // Subscribe to the event
      const iterator = service.asyncIterator(trigger);

      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger, {
        [trigger]: payload,
      });
      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledWith(trigger);
      expect(iterator).toBe(mockIterator);
    });

    it('should handle multiple concurrent publishes', async () => {
      const trigger1 = 'event1';
      const trigger2 = 'event2';
      const payload1 = { data: 'first' };
      const payload2 = { data: 'second' };

      mockPubSub.publish.mockResolvedValue(undefined);

      // Publish multiple events concurrently
      await Promise.all([
        service.publish(trigger1, payload1),
        service.publish(trigger2, payload2),
      ]);

      expect(mockPubSub.publish).toHaveBeenCalledTimes(2);
      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger1, {
        [trigger1]: payload1,
      });
      expect(mockPubSub.publish).toHaveBeenCalledWith(trigger2, {
        [trigger2]: payload2,
      });
    });

    it('should handle multiple subscribers to same trigger', () => {
      const trigger = 'sharedEvent';
      const mockIterator1 = { id: 'iterator1' } as any;
      const mockIterator2 = { id: 'iterator2' } as any;

      mockPubSub.asyncIterableIterator
        .mockReturnValueOnce(mockIterator1)
        .mockReturnValueOnce(mockIterator2);

      const iterator1 = service.asyncIterator(trigger);
      const iterator2 = service.asyncIterator(trigger);

      expect(mockPubSub.asyncIterableIterator).toHaveBeenCalledTimes(2);
      expect(iterator1).toBe(mockIterator1);
      expect(iterator2).toBe(mockIterator2);
    });
  });
});
