import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class SubmissionConfirmationDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Submission ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Confirmation message' })
  message: string;

  @Field()
  @ApiProperty({ description: 'Submission timestamp' })
  submittedAt: Date;

  @Field()
  @ApiProperty({ description: 'Redeemed coupon code' })
  couponCode: string;

  @Field()
  @ApiProperty({ description: 'User name from submission' })
  userName: string;

  @Field()
  @ApiProperty({ description: 'User email from submission' })
  userEmail: string;

  @Field()
  @ApiProperty({ description: 'Name of the reward type the user selected' })
  selectedRewardName: string;

  @Field()
  @ApiProperty({ 
    description: 'Information about next steps',
    example: 'Thank you for your submission! You have selected Netflix Subscription as your preferred reward. Our administrators will review your entry and contact you if you are selected to receive the actual reward account.'
  })
  nextSteps: string;
}