# Product API - NestJS Application

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A comprehensive NestJS application featuring a standardized Product API with advanced caching, HATEOAS implementation, and robust error handling.</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-documentation">API Docs</a> •
  <a href="#development">Development</a> •
  <a href="#testing">Testing</a>
</p>

---

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [Database Operations](#database-operations)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Development Guidelines](#development-guidelines)
- [Adding New Features](#adding-new-features)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

## ✨ Features

### Core Features

- **🚀 Dual API Support**: REST and GraphQL interfaces sharing the same business logic
- **📊 Standardized Responses**: Consistent API response structures with HATEOAS links
- **⚡ Advanced Caching**: ETag-based caching with conditional requests (304 Not Modified)
- **🛡️ Robust Error Handling**: Detailed error responses with trace IDs and helpful hints
- **🔍 Advanced Querying**: Filtering, sorting, pagination, and field selection
- **✅ Comprehensive Validation**: Input validation with detailed error messages
- **📈 Performance Monitoring**: Request tracing, query optimization, and structured logging
- **📚 Interactive Documentation**: Swagger/OpenAPI documentation with examples

### Technical Features

- **🗄️ PostgreSQL Database**: Production-ready with Neon cloud database
- **🔄 Real-time Subscriptions**: GraphQL subscriptions for live updates
- **🏗️ Clean Architecture**: Modular design with separation of concerns
- **🧪 Test Coverage**: Unit tests, integration tests, and E2E tests
- **🔧 Development Tools**: Hot reload, debugging support, and development scripts

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **PostgreSQL Database** - We use [Neon](https://neon.tech/) for cloud PostgreSQL
- **Git** - For version control

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd master-structure
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Using yarn
yarn install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:your_password@your_host.neon.tech/neondb?sslmode=require"

# Application Configuration
PORT=3000
NODE_ENV=development

# Optional: Logging Configuration
LOG_LEVEL=info
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# OR run migrations (for production)
npx prisma migrate dev --name init

# View your database
npx prisma studio
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)

```bash
# Start with hot reload
npm run start:dev

# Start with debugging
npm run start:debug
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### 🌐 Access Points

Once running, you can access:

| Service                | URL                                                                                              | Description               |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------- |
| **REST API**           | [http://localhost:3000/api/v1](http://localhost:3000/api/v1)                                     | RESTful endpoints         |
| **GraphQL Playground** | [http://localhost:3000/graphql](http://localhost:3000/graphql)                                   | Interactive GraphQL IDE   |
| **API Documentation**  | [http://localhost:3000/api/docs](http://localhost:3000/api/docs)                                 | Swagger/OpenAPI docs      |
| **Health Check**       | [http://localhost:3000/api/v1/monitoring/health](http://localhost:3000/api/v1/monitoring/health) | Application health status |

## 🗄️ Database Operations

### Prisma Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and run migrations (production)
npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ This will delete all data)
npx prisma migrate reset

# View and edit data in browser
npx prisma studio

# Check migration status
npx prisma migrate status

# Deploy migrations to production
npx prisma migrate deploy
```

### Database Schema Updates

When you modify `prisma/schema.prisma`:

1. **For Development:**

   ```bash
   npx prisma db push
   npx prisma generate
   ```

2. **For Production:**
   ```bash
   npx prisma migrate dev --name describe_your_changes
   npx prisma generate
   ```

## 📚 API Documentation

### Interactive Documentation

- **Swagger/OpenAPI**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **GraphQL Playground**: [http://localhost:3000/graphql](http://localhost:3000/graphql)

### Additional Documentation

- **Migration Guide**: [docs/api-migration-guide.md](docs/api-migration-guide.md)
- **GraphQL Examples**: [graphql-examples.md](graphql-examples.md)
- **GraphQL Testing Summary**: [GraphQL-Testing-Summary.md](GraphQL-Testing-Summary.md)
- **PostgreSQL Migration**: [PostgreSQL-Migration-Summary.md](PostgreSQL-Migration-Summary.md)

### Quick API Examples

#### REST API Examples

```bash
# Get all products with pagination
curl "http://localhost:3000/api/v1/products?page=1&limit=10"

# Create a new product
curl -X POST "http://localhost:3000/api/v1/products" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro 16\"",
    "description": "High-performance laptop",
    "price": 2499.99,
    "category": "electronics"
  }'

# Filter products by category and price range
curl "http://localhost:3000/api/v1/products?category=electronics&minPrice=1000&maxPrice=3000"

# Search products
curl "http://localhost:3000/api/v1/products?search=laptop"

# Get specific fields only
curl "http://localhost:3000/api/v1/products?fields=id,name,price"
```

#### GraphQL Examples

```graphql
# Query products
query GetProducts {
  products {
    id
    name
    price
    category
  }
}

# Create a product
mutation CreateProduct {
  createProduct(
    createProductInput: {
      name: "MacBook Pro 16\""
      description: "High-performance laptop"
      price: 2499.99
      category: "electronics"
    }
  ) {
    id
    name
    price
  }
}

# Subscribe to product updates
subscription ProductUpdates {
  productUpdated {
    id
    name
    price
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:cov

# Run specific test file
npm run test -- product.service.spec.ts

# Run tests with debugging
npm run test:debug
```

### Custom Test Scripts

We've included custom PowerShell scripts for API testing:

```bash
# Test REST API endpoints
.\test-api.ps1

# Test GraphQL endpoints
.\test-graphql.ps1

# Test GraphQL mutations
.\test-graphql-mutations.ps1

# Test PostgreSQL connection
.\test-postgresql.ps1

# Simple GraphQL test
.\test-simple-graphql.ps1
```

### Test Structure

```
test/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
└── fixtures/            # Test data and fixtures

src/
├── **/*.spec.ts         # Unit tests alongside source files
└── **/*.e2e-spec.ts     # E2E tests
```

### Writing Tests

#### Unit Test Example

```typescript
// src/modules/product/product.service.spec.ts
describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should create a product', async () => {
    const productData = {
      name: 'Test Product',
      price: 99.99,
      category: 'electronics',
    };

    const result = await service.create(productData);
    expect(result.data.name).toBe('Test Product');
  });
});
```

#### E2E Test Example

```typescript
// test/product.e2e-spec.ts
describe('Product API (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/products (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
```

## 🛠️ Development Guidelines

### Code Style and Standards

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Configured with NestJS recommended rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for code quality

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new product search functionality
fix: resolve validation error in product creation
docs: update API documentation
test: add unit tests for product service
refactor: improve error handling in controllers
```

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

## 🏗️ Adding New Features

### 1. Create a New Module

```bash
# Generate a new module
nest generate module modules/category
nest generate service modules/category
nest generate controller api/rest/category
```

### 2. Follow the Project Structure

```
src/
├── modules/category/           # Business logic layer
│   ├── category.service.ts     # Business logic
│   ├── category.repository.ts  # Data access layer
│   ├── category.module.ts      # Module definition
│   └── dto/                    # Data transfer objects
├── api/rest/category/          # REST API layer
│   ├── category.controller.ts  # REST endpoints
│   └── dto/                    # REST-specific DTOs
└── graphql/category/           # GraphQL API layer
    ├── category.resolver.ts    # GraphQL resolvers
    └── dto/                    # GraphQL-specific DTOs
```

### 3. Implement Following Patterns

#### Service Layer Pattern

```typescript
// src/modules/category/category.service.ts
@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly responseBuilder: ResponseBuilderService,
    private readonly traceIdService: TraceIdService,
  ) {}

  async create(
    data: CreateCategoryDto,
    baseUrl: string,
  ): Promise<ApiResponse<Category>> {
    const traceId = this.traceIdService.getTraceId();

    // Validation
    this.validateCreateData(data);

    // Business logic
    const category = await this.categoryRepository.create(data);

    // Build response with HATEOAS links
    const links = this.responseBuilder.generateHATEOASLinks({
      baseUrl,
      resourceId: category.id,
      action: 'create',
    });

    return this.responseBuilder.buildSuccessResponse(
      category,
      'Category created successfully',
      201,
      traceId,
      links,
    );
  }
}
```

#### Repository Pattern

```typescript
// src/modules/category/category.repository.ts
@Injectable()
export class CategoryRepository extends BaseRepository<Category, number> {
  constructor(
    private prisma: PrismaService,
    private queryOptimizer: QueryOptimizerService,
  ) {
    super();
  }

  @PerformanceMonitor('CategoryRepository.findById')
  async findById(id: number): Promise<Category | null> {
    return this.queryOptimizer.executeWithMonitoring(
      'category_find_by_id',
      () => this.prisma.category.findUnique({ where: { id } }),
      { categoryId: id },
    );
  }
}
```

#### REST Controller Pattern

```typescript
// src/api/rest/category/category.controller.ts
@ApiTags('Categories')
@Controller('api/v1/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @Req() request: Request,
  ): Promise<ApiResponse<Category>> {
    const baseUrl = this.getBaseUrl(request);
    return this.categoryService.create(createCategoryDto, baseUrl);
  }
}
```

#### GraphQL Resolver Pattern

```typescript
// src/graphql/category/category.resolver.ts
@Resolver(() => CategoryDTO)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Query(() => [CategoryDTO])
  async categories(): Promise<Category[]> {
    const response = await this.categoryService.findAll({}, '');
    return response.data;
  }

  @Mutation(() => CategoryDTO)
  async createCategory(
    @Args('createCategoryInput') input: CreateCategoryInput,
  ): Promise<Category> {
    const response = await this.categoryService.create(input, '');
    return response.data;
  }
}
```

### 4. Update Database Schema

```prisma
// prisma/schema.prisma
model Category {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  products    Product[]

  // Indexes
  @@index([name])
  @@map("categories")
}
```

### 5. Create and Run Migration

```bash
# Create migration
npx prisma migrate dev --name add_category_model

# Generate Prisma client
npx prisma generate
```

### 6. Add Validation Rules

```typescript
// src/modules/category/dto/create-category.dto.ts
export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  @ApiProperty({ example: 'Electronics' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiProperty({ example: 'Electronic devices and accessories' })
  description?: string;
}
```

### 7. Write Tests

```typescript
// src/modules/category/category.service.spec.ts
describe('CategoryService', () => {
  // Unit tests for service methods
});

// src/api/rest/category/category.controller.spec.ts
describe('CategoryController', () => {
  // Unit tests for controller endpoints
});

// test/category.e2e-spec.ts
describe('Category API (e2e)', () => {
  // End-to-end tests
});
```

## 📁 Project Structure

```
master-structure/
├── 📁 src/
│   ├── 📁 api/                    # API layer (REST endpoints)
│   │   └── 📁 rest/
│   │       ├── 📁 product/        # Product REST endpoints
│   │       └── 📁 monitoring/     # Monitoring endpoints
│   ├── 📁 graphql/                # GraphQL layer
│   │   └── 📁 product/            # Product GraphQL resolvers
│   ├── 📁 modules/                # Business logic layer
│   │   ├── 📁 product/            # Product business logic
│   │   └── 📁 user/               # User business logic
│   ├── 📁 shared/                 # Shared utilities
│   │   ├── 📁 decorators/         # Custom decorators
│   │   ├── 📁 dto/                # Shared DTOs
│   │   ├── 📁 exceptions/         # Custom exceptions
│   │   ├── 📁 filters/            # Exception filters
│   │   ├── 📁 interceptors/       # Request/response interceptors
│   │   ├── 📁 middleware/         # Custom middleware
│   │   ├── 📁 pipes/              # Validation pipes
│   │   ├── 📁 repositories/       # Base repository classes
│   │   ├── 📁 services/           # Shared services
│   │   └── 📁 types/              # TypeScript type definitions
│   ├── 📁 core/                   # Core configuration
│   │   └── 📁 config/
│   │       └── 📁 prisma/         # Database configuration
│   ├── 📁 config/                 # Application configuration
│   ├── 📁 logger/                 # Logging configuration
│   ├── 📄 app.module.ts           # Root application module
│   └── 📄 main.ts                 # Application entry point
├── 📁 prisma/                     # Database schema and migrations
│   ├── 📄 schema.prisma           # Database schema
│   └── 📁 migrations/             # Database migrations
├── 📁 test/                       # Test files
├── 📁 docs/                       # Documentation
├── 📄 .env                        # Environment variables
├── 📄 package.json                # Dependencies and scripts
└── 📄 README.md                   # This file
```

### Layer Responsibilities

#### 1. **API Layer** (`src/api/` & `src/graphql/`)

- Handle HTTP requests/responses
- Input validation and transformation
- Authentication and authorization
- Rate limiting and caching
- API documentation

#### 2. **Business Logic Layer** (`src/modules/`)

- Core business logic
- Data validation and transformation
- Business rules enforcement
- Service orchestration
- Domain-specific operations

#### 3. **Data Access Layer** (`src/modules/*/repositories/`)

- Database operations
- Query optimization
- Data mapping and transformation
- Connection management
- Performance monitoring

#### 4. **Shared Layer** (`src/shared/`)

- Cross-cutting concerns
- Utility functions
- Common interfaces and types
- Reusable components
- Infrastructure services

## 🚀 Deployment

### Environment Setup

Create environment-specific `.env` files:

```bash
# .env.development
DATABASE_URL="postgresql://dev_user:password@localhost:5432/dev_db"
NODE_ENV=development
LOG_LEVEL=debug

# .env.production
DATABASE_URL="postgresql://prod_user:password@prod_host:5432/prod_db"
NODE_ENV=production
LOG_LEVEL=info
```

### Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Using PM2 for process management
npm install -g pm2
pm2 start dist/main.js --name "product-api"
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
```

```bash
# Build and run with Docker
docker build -t product-api .
docker run -p 3000:3000 --env-file .env.production product-api
```

### Cloud Deployment Options

- **Vercel**: Serverless deployment with automatic scaling
- **Railway**: Simple deployment with PostgreSQL included
- **Heroku**: Traditional PaaS with add-ons
- **AWS ECS**: Container-based deployment
- **Google Cloud Run**: Serverless containers

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connection
npx prisma db pull

# Reset database if needed
npx prisma migrate reset --force

# Regenerate Prisma client
npx prisma generate
```

#### Port Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process_id> /F

# Or use a different port
PORT=3001 npm run start:dev
```

#### Module Resolution Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist
npm run build
```

### Performance Optimization

#### Database Query Optimization

```bash
# View slow queries
npx prisma studio

# Check query performance
curl http://localhost:3000/api/v1/monitoring/database/query-stats
```

#### Memory Usage Monitoring

```bash
# Check application performance
curl http://localhost:3000/api/v1/monitoring/system/resources
```

## 📊 Monitoring and Observability

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/v1/monitoring/health

# Database health
curl http://localhost:3000/api/v1/monitoring/database/query-stats
```

### Performance Metrics

```bash
# Performance statistics
curl http://localhost:3000/api/v1/monitoring/performance/stats

# Query optimization recommendations
curl http://localhost:3000/api/v1/monitoring/database/optimization-recommendations
```

### Logging

The application uses structured logging with different levels:

- **Error**: Application errors and exceptions
- **Warn**: Warning messages and slow queries
- **Info**: General application information
- **Debug**: Detailed debugging information

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the coding standards
4. **Write tests** for your changes
5. **Run tests**: `npm run test`
6. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Review Checklist

- [ ] Code follows TypeScript and ESLint standards
- [ ] All tests pass
- [ ] New features have corresponding tests
- [ ] API documentation is updated
- [ ] Database migrations are included (if applicable)
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## 📚 Resources

### NestJS Resources

- [NestJS Documentation](https://docs.nestjs.com) - Official documentation
- [NestJS Discord](https://discord.gg/G7Qnnhy) - Community support
- [NestJS Courses](https://courses.nestjs.com/) - Official video courses

### Database Resources

- [Prisma Documentation](https://www.prisma.io/docs) - Database toolkit
- [Neon Documentation](https://neon.tech/docs) - Serverless PostgreSQL
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) - Database documentation

### GraphQL Resources

- [GraphQL Documentation](https://graphql.org/learn/) - GraphQL specification
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - GraphQL server

## 📄 License

This project is [MIT licensed](LICENSE).

---

<p align="center">
  <strong>Built with ❤️ using NestJS, PostgreSQL, and GraphQL</strong>
</p>

<p align="center">
  <a href="#top">⬆️ Back to Top</a>
</p>
