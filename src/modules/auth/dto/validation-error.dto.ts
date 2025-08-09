import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('AuthValidationError')
export class AuthValidationErrorDto {
  @Field({
    description: 'Field that failed validation'
  })
  @ApiProperty({
    description: 'Field that failed validation',
    example: 'email'
  })
  field: string;

  @Field({
    description: 'Validation error message'
  })
  @ApiProperty({
    description: 'Validation error message',
    example: 'Please provide a valid email address'
  })
  message: string;

  @Field({
    description: 'Error code for programmatic handling'
  })
  @ApiProperty({
    description: 'Error code for programmatic handling',
    example: 'INVALID_EMAIL'
  })
  code: string;
}

@ObjectType('AuthErrorResponse')
export class AuthErrorResponseDto {
  @Field({
    description: 'Success status'
  })
  @ApiProperty({
    description: 'Success status',
    example: false
  })
  success: boolean;

  @Field({
    description: 'HTTP status code'
  })
  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @Field({
    description: 'Error message'
  })
  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed'
  })
  message: string;

  @Field(() => [AuthValidationErrorDto], { 
    nullable: true,
    description: 'Array of validation errors'
  })
  @ApiProperty({
    description: 'Array of validation errors',
    type: [AuthValidationErrorDto],
    required: false
  })
  errors?: AuthValidationErrorDto[];

  @Field({
    description: 'Timestamp of the error'
  })
  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-15T10:30:00Z'
  })
  timestamp: string;
}