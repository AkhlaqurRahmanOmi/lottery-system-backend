import { BaseRepository } from './base.repository';
import { FilterOptions, PaginatedResult, QueryOptions } from '../types';

// Mock implementation for testing
class MockRepository extends BaseRepository<any, number> {
  private mockData: any[] = [
    { id: 1, name: 'Item 1', category: 'A', price: 10 },
    { id: 2, name: 'Item 2', category: 'B', price: 20 },
    { id: 3, name: 'Item 3', category: 'A', price: 30 },
    { id: 4, name: 'Item 4', category: 'C', price: 40 },
    { id: 5, name: 'Item 5', category: 'B', price: 50 },
  ];

  async findById(id: number): Promise<any | null> {
    return this.mockData.find(item => item.id === id) || null;
  }

  async findAll(): Promise<any[]> {
    return [...this.mockData];
  }

  async create(data: Partial<any>): Promise<any> {
    const newItem = { id: Date.now(), ...data };
    this.mockData.push(newItem);
    return newItem;
  }

  async update(id: number, data: Partial<any>): Promise<any> {
    const index = this.mockData.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    this.mockData[index] = { ...this.mockData[index], ...data };
    return this.mockData[index];
  }

  async delete(id: number): Promise<void> {
    const index = this.mockData.findIndex(item => item.id === id);
    if (index === -1) throw new Error('Item not found');
    this.mockData.splice(index, 1);
  }

  async findWithFilters(options: QueryOptions): Promise<PaginatedResult<any>> {
    let filteredData = [...this.mockData];

    // Apply filters
    if (options.filters) {
      filteredData = filteredData.filter(item => {
        return Object.entries(options.filters!).every(([key, value]) => {
          if (key === 'minPrice') return item.price >= value;
          if (key === 'maxPrice') return item.price <= value;
          return item[key] === value;
        });
      });
    }

    // Apply sorting
    if (options.sort) {
      const { field, order } = options.sort;
      filteredData.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return order === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const page = options.pagination?.page || 1;
    const limit = options.pagination?.limit || 10;
    const offset = (page - 1) * limit;
    const paginatedData = filteredData.slice(offset, offset + limit);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async search(query: string, fields: string[]): Promise<any[]> {
    const lowerQuery = query.toLowerCase();
    return this.mockData.filter(item => {
      return fields.some(field => {
        const fieldValue = item[field];
        return fieldValue && fieldValue.toString().toLowerCase().includes(lowerQuery);
      });
    });
  }

  async countTotal(filters?: FilterOptions): Promise<number> {
    if (!filters) return this.mockData.length;

    const filteredData = this.mockData.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'minPrice') return item.price >= value;
        if (key === 'maxPrice') return item.price <= value;
        return item[key] === value;
      });
    });

    return filteredData.length;
  }
}

describe('BaseRepository', () => {
  let repository: MockRepository;

  beforeEach(() => {
    repository = new MockRepository();
  });

  describe('findWithFilters', () => {
    it('should return all items when no filters are applied', async () => {
      const result = await repository.findWithFilters({});

      expect(result.data).toHaveLength(5);
      expect(result.pagination.totalItems).toBe(5);
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should filter items by category', async () => {
      const options: QueryOptions = {
        filters: { category: 'A' },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.category === 'A')).toBe(true);
    });

    it('should filter items by price range', async () => {
      const options: QueryOptions = {
        filters: { minPrice: 20, maxPrice: 40 },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data).toHaveLength(3);
      expect(result.data.every(item => item.price >= 20 && item.price <= 40)).toBe(true);
    });

    it('should sort items by field in ascending order', async () => {
      const options: QueryOptions = {
        sort: { field: 'price', order: 'asc' },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data[0].price).toBe(10);
      expect(result.data[4].price).toBe(50);
    });

    it('should sort items by field in descending order', async () => {
      const options: QueryOptions = {
        sort: { field: 'price', order: 'desc' },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data[0].price).toBe(50);
      expect(result.data[4].price).toBe(10);
    });

    it('should paginate results correctly', async () => {
      const options: QueryOptions = {
        pagination: { page: 2, limit: 2 },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should combine filters, sorting, and pagination', async () => {
      const options: QueryOptions = {
        filters: { category: 'A' },
        sort: { field: 'price', order: 'desc' },
        pagination: { page: 1, limit: 1 },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].category).toBe('A');
      expect(result.data[0].price).toBe(30); // Higher price item from category A
      expect(result.pagination.totalItems).toBe(2);
    });

    it('should handle empty results', async () => {
      const options: QueryOptions = {
        filters: { category: 'NonExistent' },
      };

      const result = await repository.findWithFilters(options);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.totalItems).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('search', () => {
    it('should search across specified fields', async () => {
      const result = await repository.search('Item 1', ['name']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 1');
    });

    it('should search case-insensitively', async () => {
      const result = await repository.search('item 2', ['name']);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Item 2');
    });

    it('should search across multiple fields', async () => {
      const result = await repository.search('A', ['name', 'category']);

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(item => item.category === 'A')).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const result = await repository.search('NonExistent', ['name']);

      expect(result).toHaveLength(0);
    });

    it('should handle partial matches', async () => {
      const result = await repository.search('Item', ['name']);

      expect(result).toHaveLength(5); // All items contain "Item"
    });
  });

  describe('countTotal', () => {
    it('should return total count without filters', async () => {
      const count = await repository.countTotal();

      expect(count).toBe(5);
    });

    it('should return filtered count with filters', async () => {
      const count = await repository.countTotal({ category: 'A' });

      expect(count).toBe(2);
    });

    it('should return filtered count with price range', async () => {
      const count = await repository.countTotal({ minPrice: 20, maxPrice: 40 });

      expect(count).toBe(3);
    });

    it('should return zero for non-matching filters', async () => {
      const count = await repository.countTotal({ category: 'NonExistent' });

      expect(count).toBe(0);
    });
  });

  // Test existing abstract methods are still working
  describe('existing methods', () => {
    it('should find item by id', async () => {
      const item = await repository.findById(1);

      expect(item).toBeDefined();
      expect(item.id).toBe(1);
    });

    it('should return null for non-existent id', async () => {
      const item = await repository.findById(999);

      expect(item).toBeNull();
    });

    it('should find all items', async () => {
      const items = await repository.findAll();

      expect(items).toHaveLength(5);
    });

    it('should create new item', async () => {
      const newItem = await repository.create({ name: 'New Item', category: 'D', price: 60 });

      expect(newItem.name).toBe('New Item');
      expect(newItem.id).toBeDefined();
    });

    it('should update existing item', async () => {
      const updatedItem = await repository.update(1, { name: 'Updated Item' });

      expect(updatedItem.name).toBe('Updated Item');
      expect(updatedItem.id).toBe(1);
    });

    it('should delete item', async () => {
      await repository.delete(1);
      const item = await repository.findById(1);

      expect(item).toBeNull();
    });

    it('should throw error when updating non-existent item', async () => {
      await expect(repository.update(999, { name: 'Updated' })).rejects.toThrow('Item not found');
    });

    it('should throw error when deleting non-existent item', async () => {
      await expect(repository.delete(999)).rejects.toThrow('Item not found');
    });
  });
});