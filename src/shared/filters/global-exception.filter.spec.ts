import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ResponseBuilderService } from '../services/response-builder.service';
import { TraceIdService } from '../services/trace-id.service';
import { ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationException } from '../exceptions/validation.exception';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let responseBuilder: jest.Mocked<ResponseBuilderService>;
  let traceIdService: jest.Mocked<TraceIdService>;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const mockResponseBuilder = {
      buildErrorResponse: jest.fn(),
    };

    const mockTraceIdService = {
      getTraceId: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/test',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: ResponseBuilderService,
          useValue: mockResponseBuilder,
        },
        {
          provide: TraceIdService,
          useValue: mockTraceIdService,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    responseBuilder = module.get(ResponseBuilderService);
    traceIdService = module.get(TraceIdService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should handle HTTP exceptions correctly', () => {
      const traceId = 'test-trace-id';
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const expectedErrorResponse = {
        success: false,
        statusCode: 400,
        error: { code: 'BAD_REQUEST', message: 'Test error' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(exception, mockHost);

      expect(traceIdService.getTraceId).toHaveBeenCalled();
      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'BAD_REQUEST',
        'Test error',
        400,
        traceId,
        '/api/test',
        undefined,
        'Please check your request parameters and try again'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedErrorResponse);
    });

    it('should handle validation errors from HTTP exceptions', () => {
      const traceId = 'test-trace-id';
      const validationResponse = {
        message: [
          {
            property: 'email',
            constraints: { isEmail: 'email must be an email' },
            value: 'invalid-email',
          },
        ],
      };
      const exception = new HttpException(validationResponse, HttpStatus.BAD_REQUEST);
      const expectedErrorResponse = {
        success: false,
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(exception, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        traceId,
        '/api/test',
        [
          {
            field: 'email',
            message: 'email must be an email',
            value: 'invalid-email',
            constraint: 'isEmail',
          },
        ],
        'Please check the API documentation for valid input formats'
      );
    });

    it('should handle Prisma unique constraint errors', () => {
      const traceId = 'test-trace-id';
      const prismaError = {
        code: 'P2002',
        meta: { target: ['email'] },
        message: 'Unique constraint failed',
      };
      const expectedErrorResponse = {
        success: false,
        statusCode: 409,
        error: { code: 'UNIQUE_CONSTRAINT_VIOLATION', message: 'A record with this value already exists' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(prismaError, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'UNIQUE_CONSTRAINT_VIOLATION',
        'A record with this value already exists',
        409,
        traceId,
        '/api/test',
        'Unique constraint failed on field: email',
        'Please use a different value for the specified field(s)'
      );
    });

    it('should handle Prisma record not found errors', () => {
      const traceId = 'test-trace-id';
      const prismaError = {
        code: 'P2025',
        message: 'Record not found',
      };
      const expectedErrorResponse = {
        success: false,
        statusCode: 404,
        error: { code: 'RECORD_NOT_FOUND', message: 'The requested record was not found' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(prismaError, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'RECORD_NOT_FOUND',
        'The requested record was not found',
        404,
        traceId,
        '/api/test',
        undefined,
        'Please verify the ID and try again'
      );
    });

    it('should handle ValidationException', () => {
      const traceId = 'test-trace-id';
      const validationErrors = [
        {
          field: 'name',
          message: 'name should not be empty',
          value: '',
          constraint: 'isNotEmpty',
        },
      ];
      const exception = new ValidationException(validationErrors);
      const expectedErrorResponse = {
        success: false,
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(exception, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        traceId,
        '/api/test',
        validationErrors,
        'Please check the API documentation for valid input formats'
      );
    });

    it('should handle class-validator errors directly', () => {
      const traceId = 'test-trace-id';
      const validationError = new ClassValidatorError();
      validationError.property = 'name';
      validationError.value = '';
      validationError.constraints = { isNotEmpty: 'name should not be empty' };

      const validationErrors = [validationError];
      const expectedErrorResponse = {
        success: false,
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(validationErrors, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        traceId,
        '/api/test',
        [
          {
            field: 'name',
            message: 'name should not be empty',
            value: '',
            constraint: 'isNotEmpty',
          },
        ],
        'Please check the API documentation for valid input formats'
      );
    });

    it('should handle nested validation errors', () => {
      const traceId = 'test-trace-id';
      const parentError = new ClassValidatorError();
      parentError.property = 'user';
      parentError.value = {};

      const childError = new ClassValidatorError();
      childError.property = 'email';
      childError.value = 'invalid';
      childError.constraints = { isEmail: 'email must be an email' };

      parentError.children = [childError];
      const validationErrors = [parentError];

      const expectedErrorResponse = {
        success: false,
        statusCode: 400,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(validationErrors, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'VALIDATION_ERROR',
        'Invalid input data',
        400,
        traceId,
        '/api/test',
        [
          {
            field: 'user.email',
            message: 'email must be an email',
            value: 'invalid',
            constraint: 'isEmail',
          },
        ],
        'Please check the API documentation for valid input formats'
      );
    });

    it('should handle generic errors', () => {
      const traceId = 'test-trace-id';
      const genericError = new Error('Something went wrong');
      const expectedErrorResponse = {
        success: false,
        statusCode: 500,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(genericError, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred',
        500,
        traceId,
        '/api/test',
        undefined,
        'Please try again later or contact support if the problem persists'
      );
    });

    it('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const traceId = 'test-trace-id';
      const genericError = new Error('Something went wrong');
      const expectedErrorResponse = {
        success: false,
        statusCode: 500,
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
      };

      traceIdService.getTraceId.mockReturnValue(traceId);
      responseBuilder.buildErrorResponse.mockReturnValue(expectedErrorResponse as any);

      filter.catch(genericError, mockHost);

      expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred',
        500,
        traceId,
        '/api/test',
        'Something went wrong',
        'Please try again later or contact support if the problem persists'
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle different HTTP status codes correctly', () => {
      const testCases = [
        { status: HttpStatus.UNAUTHORIZED, expectedCode: 'UNAUTHORIZED' },
        { status: HttpStatus.FORBIDDEN, expectedCode: 'FORBIDDEN' },
        { status: HttpStatus.NOT_FOUND, expectedCode: 'NOT_FOUND' },
        { status: HttpStatus.CONFLICT, expectedCode: 'CONFLICT' },
        { status: HttpStatus.UNPROCESSABLE_ENTITY, expectedCode: 'UNPROCESSABLE_ENTITY' },
      ];

      testCases.forEach(({ status, expectedCode }) => {
        const traceId = 'test-trace-id';
        const exception = new HttpException('Test error', status);

        traceIdService.getTraceId.mockReturnValue(traceId);
        responseBuilder.buildErrorResponse.mockReturnValue({} as any);

        filter.catch(exception, mockHost);

        expect(responseBuilder.buildErrorResponse).toHaveBeenCalledWith(
          expectedCode,
          'Test error',
          status,
          traceId,
          '/api/test',
          undefined,
          expect.any(String)
        );

        jest.clearAllMocks();
      });
    });
  });
});