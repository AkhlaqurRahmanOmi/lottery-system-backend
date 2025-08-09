import { validate } from 'class-validator';
import {
  IsPositivePrice,
  IsValidCategory,
  IsValidProductName,
  IsValidDescription,
  IsValidPage,
  IsValidLimit,
  IsValidSortField,
  IsValidSortOrder,
} from './validation.decorators';

class TestProductDto {
  @IsPositivePrice()
  price: number;

  @IsValidCategory()
  category: string;

  @IsValidProductName()
  name: string;

  @IsValidDescription()
  description?: string;
}

class TestQueryDto {
  @IsValidPage()
  page?: number;

  @IsValidLimit()
  limit?: number;

  @IsValidSortField()
  sortBy?: string;

  @IsValidSortOrder()
  sortOrder?: string;
}

describe('Validation Decorators', () => {
  describe('IsPositivePrice', () => {
    it('should pass for valid positive prices', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const priceErrors = errors.filter(error => error.property === 'price');
      expect(priceErrors).toHaveLength(0);
    });

    it('should fail for negative prices', async () => {
      const dto = new TestProductDto();
      dto.price = -10;
      dto.category = 'electronics';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const priceErrors = errors.filter(error => error.property === 'price');
      expect(priceErrors).toHaveLength(1);
      expect(priceErrors[0].constraints).toHaveProperty('isPositivePrice');
    });

    it('should fail for zero price', async () => {
      const dto = new TestProductDto();
      dto.price = 0;
      dto.category = 'electronics';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const priceErrors = errors.filter(error => error.property === 'price');
      expect(priceErrors).toHaveLength(1);
    });

    it('should fail for prices exceeding maximum', async () => {
      const dto = new TestProductDto();
      dto.price = 1000000;
      dto.category = 'electronics';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const priceErrors = errors.filter(error => error.property === 'price');
      expect(priceErrors).toHaveLength(1);
    });

    it('should fail for non-numeric values', async () => {
      const dto = new TestProductDto();
      dto.price = 'invalid' as any;
      dto.category = 'electronics';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const priceErrors = errors.filter(error => error.property === 'price');
      expect(priceErrors).toHaveLength(1);
    });
  });

  describe('IsValidCategory', () => {
    it('should pass for valid categories', async () => {
      const validCategories = ['electronics', 'clothing', 'books', 'home', 'sports'];
      
      for (const category of validCategories) {
        const dto = new TestProductDto();
        dto.price = 29.99;
        dto.category = category;
        dto.name = 'Test Product';

        const errors = await validate(dto);
        const categoryErrors = errors.filter(error => error.property === 'category');
        expect(categoryErrors).toHaveLength(0);
      }
    });

    it('should pass for valid categories in different cases', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'ELECTRONICS';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const categoryErrors = errors.filter(error => error.property === 'category');
      expect(categoryErrors).toHaveLength(0);
    });

    it('should fail for invalid categories', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'invalid-category';
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const categoryErrors = errors.filter(error => error.property === 'category');
      expect(categoryErrors).toHaveLength(1);
      expect(categoryErrors[0].constraints).toHaveProperty('isValidCategory');
    });

    it('should fail for non-string values', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 123 as any;
      dto.name = 'Test Product';

      const errors = await validate(dto);
      const categoryErrors = errors.filter(error => error.property === 'category');
      expect(categoryErrors).toHaveLength(1);
    });
  });

  describe('IsValidProductName', () => {
    it('should pass for valid product names', async () => {
      const validNames = [
        'iPhone 15 Pro',
        'Samsung Galaxy S24',
        'Nike Air Max 90',
        'Dell XPS 13',
        "Men's Running Shoes",
      ];

      for (const name of validNames) {
        const dto = new TestProductDto();
        dto.price = 29.99;
        dto.category = 'electronics';
        dto.name = name;

        const errors = await validate(dto);
        const nameErrors = errors.filter(error => error.property === 'name');
        expect(nameErrors).toHaveLength(0);
      }
    });

    it('should fail for names that are too short', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'A';

      const errors = await validate(dto);
      const nameErrors = errors.filter(error => error.property === 'name');
      expect(nameErrors).toHaveLength(1);
    });

    it('should fail for names that are too long', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'A'.repeat(101);

      const errors = await validate(dto);
      const nameErrors = errors.filter(error => error.property === 'name');
      expect(nameErrors).toHaveLength(1);
    });

    it('should fail for names with invalid characters', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Product@Name!';

      const errors = await validate(dto);
      const nameErrors = errors.filter(error => error.property === 'name');
      expect(nameErrors).toHaveLength(1);
    });

    it('should fail for names with leading/trailing spaces', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = ' Product Name ';

      const errors = await validate(dto);
      const nameErrors = errors.filter(error => error.property === 'name');
      expect(nameErrors).toHaveLength(1);
    });

    it('should fail for names with multiple consecutive spaces', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Product  Name';

      const errors = await validate(dto);
      const nameErrors = errors.filter(error => error.property === 'name');
      expect(nameErrors).toHaveLength(1);
    });
  });

  describe('IsValidDescription', () => {
    it('should pass for valid descriptions', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Test Product';
      dto.description = 'This is a valid product description.';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(error => error.property === 'description');
      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass for undefined descriptions (optional field)', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Test Product';
      // description is undefined

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(error => error.property === 'description');
      expect(descriptionErrors).toHaveLength(0);
    });

    it('should fail for descriptions that are too long', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Test Product';
      dto.description = 'A'.repeat(1001);

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(error => error.property === 'description');
      expect(descriptionErrors).toHaveLength(1);
    });

    it('should fail for empty string descriptions', async () => {
      const dto = new TestProductDto();
      dto.price = 29.99;
      dto.category = 'electronics';
      dto.name = 'Test Product';
      dto.description = '   ';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(error => error.property === 'description');
      expect(descriptionErrors).toHaveLength(1);
    });
  });

  describe('Query Parameter Validators', () => {
    describe('IsValidPage', () => {
      it('should pass for valid page numbers', async () => {
        const dto = new TestQueryDto();
        dto.page = 1;

        const errors = await validate(dto);
        const pageErrors = errors.filter(error => error.property === 'page');
        expect(pageErrors).toHaveLength(0);
      });

      it('should pass for undefined page (optional)', async () => {
        const dto = new TestQueryDto();
        // page is undefined

        const errors = await validate(dto);
        const pageErrors = errors.filter(error => error.property === 'page');
        expect(pageErrors).toHaveLength(0);
      });

      it('should fail for page numbers less than 1', async () => {
        const dto = new TestQueryDto();
        dto.page = 0;

        const errors = await validate(dto);
        const pageErrors = errors.filter(error => error.property === 'page');
        expect(pageErrors).toHaveLength(1);
      });

      it('should fail for page numbers greater than 10000', async () => {
        const dto = new TestQueryDto();
        dto.page = 10001;

        const errors = await validate(dto);
        const pageErrors = errors.filter(error => error.property === 'page');
        expect(pageErrors).toHaveLength(1);
      });
    });

    describe('IsValidLimit', () => {
      it('should pass for valid limit values', async () => {
        const dto = new TestQueryDto();
        dto.limit = 25;

        const errors = await validate(dto);
        const limitErrors = errors.filter(error => error.property === 'limit');
        expect(limitErrors).toHaveLength(0);
      });

      it('should fail for limit values greater than 100', async () => {
        const dto = new TestQueryDto();
        dto.limit = 101;

        const errors = await validate(dto);
        const limitErrors = errors.filter(error => error.property === 'limit');
        expect(limitErrors).toHaveLength(1);
      });
    });

    describe('IsValidSortField', () => {
      it('should pass for valid sort fields', async () => {
        const validFields = ['id', 'name', 'price', 'category', 'createdAt', 'updatedAt'];
        
        for (const field of validFields) {
          const dto = new TestQueryDto();
          dto.sortBy = field;

          const errors = await validate(dto);
          const sortErrors = errors.filter(error => error.property === 'sortBy');
          expect(sortErrors).toHaveLength(0);
        }
      });

      it('should fail for invalid sort fields', async () => {
        const dto = new TestQueryDto();
        dto.sortBy = 'invalidField';

        const errors = await validate(dto);
        const sortErrors = errors.filter(error => error.property === 'sortBy');
        expect(sortErrors).toHaveLength(1);
      });
    });

    describe('IsValidSortOrder', () => {
      it('should pass for valid sort orders', async () => {
        const validOrders = ['asc', 'desc', 'ASC', 'DESC'];
        
        for (const order of validOrders) {
          const dto = new TestQueryDto();
          dto.sortOrder = order;

          const errors = await validate(dto);
          const orderErrors = errors.filter(error => error.property === 'sortOrder');
          expect(orderErrors).toHaveLength(0);
        }
      });

      it('should fail for invalid sort orders', async () => {
        const dto = new TestQueryDto();
        dto.sortOrder = 'invalid';

        const errors = await validate(dto);
        const orderErrors = errors.filter(error => error.property === 'sortOrder');
        expect(orderErrors).toHaveLength(1);
      });
    });
  });
});