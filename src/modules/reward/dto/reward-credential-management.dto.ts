import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Field, ObjectType, Int, InputType } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';

/**
 * DTO for credential access request (admin only)
 */
@InputType('CredentialAccessRequestInput')
export class CredentialAccessRequestDto {
  @Field(() => Int)
  @ApiProperty({ description: 'ID of the reward account to access credentials for' })
  @IsNotEmpty()
  @IsInt()
  rewardAccountId: number;

  @Field()
  @ApiProperty({ description: 'Reason for accessing credentials (for audit logging)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  accessReason: string;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the admin requesting access' })
  @IsNotEmpty()
  @IsInt()
  requestedBy: number;
}

/**
 * DTO for credential access response (admin only)
 */
@ObjectType('CredentialAccessResponse')
export class CredentialAccessResponseDto {
  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field()
  @ApiProperty()
  serviceName: string;

  @Field()
  @ApiProperty()
  accountType: string;

  @Field()
  @ApiProperty({ description: 'Decrypted account credentials' })
  decryptedCredentials: string;

  @Field()
  @ApiProperty()
  accessedAt: Date;

  @Field(() => Int)
  @ApiProperty()
  accessedBy: number;

  @Field()
  @ApiProperty()
  accessReason: string;

  @Field()
  @ApiProperty({ description: 'Warning message about credential access for audit purposes' })
  auditWarning: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Audit log entry ID for this access' })
  auditLogId: number;
}

/**
 * DTO for credential update request
 */
@InputType('CredentialUpdateRequestInput')
export class CredentialUpdateRequestDto {
  @Field(() => Int)
  @ApiProperty({ description: 'ID of the reward account to update credentials for' })
  @IsNotEmpty()
  @IsInt()
  rewardAccountId: number;

  @Field()
  @ApiProperty({ description: 'New account credentials (will be encrypted)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  newCredentials: string;

  @Field()
  @ApiProperty({ description: 'Reason for updating credentials (for audit logging)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  updateReason: string;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of the admin updating credentials' })
  @IsNotEmpty()
  @IsInt()
  updatedBy: number;
}

/**
 * DTO for credential audit log entry
 */
@ObjectType('CredentialAuditLog')
export class CredentialAuditLogDto {
  @Field(() => Int)
  @ApiProperty()
  id: number;

  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field()
  @ApiProperty()
  action: string; // ACCESSED, UPDATED, CREATED

  @Field(() => Int)
  @ApiProperty()
  performedBy: number;

  @Field()
  @ApiProperty()
  performedByUsername: string;

  @Field()
  @ApiProperty()
  performedAt: Date;

  @Field()
  @ApiProperty()
  reason: string;

  @Field()
  @ApiProperty()
  ipAddress: string;

  @Field()
  @ApiProperty()
  userAgent: string;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  additionalContext?: string;
}

/**
 * DTO for credential security validation
 */
@ObjectType('CredentialSecurityValidation')
export class CredentialSecurityValidationDto {
  @Field()
  @ApiProperty()
  isValid: boolean;

  @Field()
  @ApiProperty()
  hasMinimumLength: boolean;

  @Field()
  @ApiProperty()
  hasSpecialCharacters: boolean;

  @Field()
  @ApiProperty()
  hasNumbers: boolean;

  @Field()
  @ApiProperty()
  hasUppercase: boolean;

  @Field()
  @ApiProperty()
  hasLowercase: boolean;

  @Field()
  @ApiProperty()
  isNotCommonPassword: boolean;

  @Field()
  @ApiProperty()
  securityScore: number; // 0-100

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  recommendations: string[];

  @Field(() => [String])
  @ApiProperty({ type: [String] })
  warnings: string[];
}

/**
 * DTO for bulk credential operations
 */
@InputType('BulkCredentialOperationInput')
export class BulkCredentialOperationDto {
  @Field(() => [Int])
  @ApiProperty({ type: [Number], description: 'Array of reward account IDs' })
  rewardAccountIds: number[];

  @Field()
  @ApiProperty({ 
    enum: ['validate', 'rotate', 'audit_access'],
    description: 'Operation to perform on credentials'
  })
  operation: 'validate' | 'rotate' | 'audit_access';

  @Field()
  @ApiProperty({ description: 'Reason for bulk operation' })
  reason: string;

  @Field(() => Int)
  @ApiProperty({ description: 'ID of admin performing bulk operation' })
  performedBy: number;
}

/**
 * DTO for credential rotation result
 */
@ObjectType('CredentialRotationResult')
export class CredentialRotationResultDto {
  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field()
  @ApiProperty()
  serviceName: string;

  @Field()
  @ApiProperty()
  rotationStatus: string; // SUCCESS, FAILED, SKIPPED

  @Field({ nullable: true })
  @ApiPropertyOptional()
  errorMessage?: string;

  @Field()
  @ApiProperty()
  rotatedAt: Date;

  @Field(() => Int)
  @ApiProperty()
  rotatedBy: number;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  newCredentialsPreview?: string; // First few characters for verification

  @Field()
  @ApiProperty()
  auditLogId: number;
}

/**
 * DTO for credential encryption status
 */
@ObjectType('CredentialEncryptionStatus')
export class CredentialEncryptionStatusDto {
  @Field(() => Int)
  @ApiProperty()
  rewardAccountId: number;

  @Field()
  @ApiProperty()
  isEncrypted: boolean;

  @Field()
  @ApiProperty()
  encryptionAlgorithm: string;

  @Field()
  @ApiProperty()
  encryptedAt: Date;

  @Field()
  @ApiProperty()
  lastAccessedAt?: Date;

  @Field(() => Int, { nullable: true })
  @ApiPropertyOptional()
  accessCount?: number;

  @Field()
  @ApiProperty()
  integrityCheckPassed: boolean;

  @Field({ nullable: true })
  @ApiPropertyOptional()
  integrityCheckError?: string;
}