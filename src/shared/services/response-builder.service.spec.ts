import { Test, TestingModule } from '@nestjs/testing';
import { ResponseBuilderService } from './response-builder.service';
import { PaginationMeta, ValidationError } from '../types';

describe('ResponseBuilderService', () => {
    let service: ResponseBuilderService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ResponseBuilderService],
        }).compile();

        service = module.get<ResponseBuilderService>(ResponseBuilderService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('buildSuccessResponse', () => {
        it('should build a standardized success response', () => {
            const data = { id: 1, name: 'Test Product' };
            const message = 'Product retrieved successfully';
            const statusCode = 200;
            const traceId = 'test-trace-id';
            const links = {
                self: '/api/products/1',
                related: {
                    update: {
                        href: '/api/products/1',
                        method: 'PUT',
                        rel: 'update'
                    }
                }
            };

            const response = service.buildSuccessResponse(
                data,
                message,
                statusCode,
                traceId,
                links
            );

            expect(response.success).toBe(true);
            expect(response.statusCode).toBe(statusCode);
            expect(response.message).toBe(message);
            expect(response.data).toEqual(data);
            expect(response.meta.traceId).toBe(traceId);
            expect(response.meta.version).toBe('1.0.0');
            expect(response.meta.timestamp).toBeDefined();
            expect(response.links).toEqual(links);
        });

        it('should include pagination metadata when provided', () => {
            const data = [{ id: 1, name: 'Product 1' }];
            const pagination: PaginationMeta = {
                currentPage: 1,
                totalPages: 5,
                totalItems: 50,
                itemsPerPage: 10,
                hasNext: true,
                hasPrev: false
            };

            const response = service.buildSuccessResponse(
                data,
                'Products retrieved',
                200,
                'trace-id',
                { self: '/api/products' },
                pagination
            );

            expect(response.meta.pagination).toEqual(pagination);
        });
    });

    describe('buildErrorResponse', () => {
        it('should build a standardized error response', () => {
            const code = 'VALIDATION_ERROR';
            const message = 'Invalid input data';
            const statusCode = 400;
            const traceId = 'error-trace-id';
            const selfUrl = '/api/products';
            const details = 'Name is required';
            const hint = 'Please provide a valid product name';

            const response = service.buildErrorResponse(
                code,
                message,
                statusCode,
                traceId,
                selfUrl,
                details,
                hint
            );

            expect(response.success).toBe(false);
            expect(response.statusCode).toBe(statusCode);
            expect(response.error.code).toBe(code);
            expect(response.error.message).toBe(message);
            expect(response.error.details).toBe(details);
            expect(response.error.hint).toBe(hint);
            expect(response.meta.traceId).toBe(traceId);
            expect(response.links.self).toBe(selfUrl);
            expect(response.links.documentation).toBe('/api/docs');
        });
    });

    describe('generateHATEOASLinks', () => {
        it('should generate links for a single resource', () => {
            const context = {
                baseUrl: '/api/products',
                resourceId: '1'
            };

            const links = service.generateHATEOASLinks(context);

            expect(links.self).toBe('/api/products/1');
            expect(links.related?.update).toEqual({
                href: '/api/products/1',
                method: 'PUT',
                rel: 'update'
            });
            expect(links.related?.delete).toEqual({
                href: '/api/products/1',
                method: 'DELETE',
                rel: 'delete'
            });
            expect(links.related?.collection).toEqual({
                href: '/api/products',
                method: 'GET',
                rel: 'collection'
            });
        });

        it('should generate links for a collection', () => {
            const context = {
                baseUrl: '/api/products'
            };

            const links = service.generateHATEOASLinks(context);

            expect(links.self).toBe('/api/products');
            expect(links.related?.create).toEqual({
                href: '/api/products',
                method: 'POST',
                rel: 'create'
            });
        });

        it('should include pagination links when pagination context is provided', () => {
            const context = {
                baseUrl: '/api/products',
                currentPage: 2,
                totalPages: 5,
                hasNext: true,
                hasPrev: true
            };

            const links = service.generateHATEOASLinks(context);

            expect(links.pagination?.first).toBe('/api/products?page=1');
            expect(links.pagination?.last).toBe('/api/products?page=5');
            expect(links.pagination?.prev).toBe('/api/products?page=1');
            expect(links.pagination?.next).toBe('/api/products?page=3');
        });
    });

    describe('buildPaginationMeta', () => {
        it('should build pagination metadata correctly', () => {
            const currentPage = 2;
            const totalItems = 25;
            const itemsPerPage = 10;

            const meta = service.buildPaginationMeta(currentPage, totalItems, itemsPerPage);

            expect(meta.currentPage).toBe(2);
            expect(meta.totalPages).toBe(3);
            expect(meta.totalItems).toBe(25);
            expect(meta.itemsPerPage).toBe(10);
            expect(meta.hasNext).toBe(true);
            expect(meta.hasPrev).toBe(true);
        });

        it('should handle first page correctly', () => {
            const meta = service.buildPaginationMeta(1, 25, 10);

            expect(meta.hasNext).toBe(true);
            expect(meta.hasPrev).toBe(false);
        });

        it('should handle last page correctly', () => {
            const meta = service.buildPaginationMeta(3, 25, 10);

            expect(meta.hasNext).toBe(false);
            expect(meta.hasPrev).toBe(true);
        });
    });

    describe('buildValidationErrors', () => {
        it('should build validation error details from class-validator errors', () => {
            const validationErrors = [
                {
                    property: 'name',
                    value: '',
                    constraints: {
                        isNotEmpty: 'name should not be empty'
                    }
                },
                {
                    property: 'price',
                    value: -10,
                    constraints: {
                        min: 'price must not be less than 0'
                    }
                }
            ];

            const errors = service.buildValidationErrors(validationErrors);

            expect(errors).toHaveLength(2);
            expect(errors[0]).toEqual({
                field: 'name',
                message: 'name should not be empty',
                value: '',
                constraint: 'isNotEmpty'
            });
            expect(errors[1]).toEqual({
                field: 'price',
                message: 'price must not be less than 0',
                value: -10,
                constraint: 'min'
            });
        });
    });

    describe('createLink', () => {
        it('should create a HATEOAS link object', () => {
            const link = service.createLink('/api/products/1', 'PUT', 'update', 'application/json');

            expect(link).toEqual({
                href: '/api/products/1',
                method: 'PUT',
                rel: 'update',
                type: 'application/json'
            });
        });

        it('should create a link without type', () => {
            const link = service.createLink('/api/products', 'GET', 'collection');

            expect(link).toEqual({
                href: '/api/products',
                method: 'GET',
                rel: 'collection'
            });
        });
    });

    describe('generateMetadata', () => {
        it('should generate response metadata', () => {
            const traceId = 'test-trace-id';
            const pagination: PaginationMeta = {
                currentPage: 1,
                totalPages: 1,
                totalItems: 5,
                itemsPerPage: 10,
                hasNext: false,
                hasPrev: false
            };

            const metadata = service.generateMetadata(traceId, pagination);

            expect(metadata.traceId).toBe(traceId);
            expect(metadata.version).toBe('1.0.0');
            expect(metadata.timestamp).toBeDefined();
            expect(metadata.pagination).toEqual(pagination);
        });
    });
});