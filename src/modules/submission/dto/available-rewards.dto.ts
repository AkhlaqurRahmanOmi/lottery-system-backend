import { ApiProperty } from '@nestjs/swagger';
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class AvailableRewardDto {
  @Field(() => Int)
  @ApiProperty({ description: 'Reward ID' })
  id: number;

  @Field()
  @ApiProperty({ description: 'Reward name/title', example: 'Netflix Premium Subscription' })
  name: string;

  @Field({ nullable: true })
  @ApiProperty({ 
    description: 'Reward description', 
    example: '1-month Netflix Premium subscription with access to all content',
    required: false 
  })
  description?: string;

  @Field({ nullable: true })
  @ApiProperty({ 
    description: 'Reward image URL', 
    example: 'https://example.com/netflix-logo.png',
    required: false 
  })
  imageUrl?: string;

  @Field(() => Int)
  @ApiProperty({ description: 'Display order for sorting rewards' })
  displayOrder: number;
}

@ObjectType()
export class AvailableRewardsResponseDto {
  @Field(() => [AvailableRewardDto])
  @ApiProperty({ 
    type: [AvailableRewardDto], 
    description: 'List of available reward types users can select from' 
  })
  rewards: AvailableRewardDto[];

  @Field()
  @ApiProperty({ 
    description: 'Information message about reward selection',
    example: 'Please select your preferred reward type. Administrators will assign actual reward accounts to selected winners.'
  })
  message: string;
}