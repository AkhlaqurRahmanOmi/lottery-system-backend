import { PartialType, OmitType } from '@nestjs/swagger';
import { InputType } from '@nestjs/graphql';
import { RewardBaseDto } from './reward-base.dto';

export class UpdateRewardDto extends PartialType(
  OmitType(RewardBaseDto, ['id', 'createdAt', 'updatedAt'] as const)
) {}

@InputType()
export class UpdateRewardInput extends PartialType(
  OmitType(RewardBaseDto, ['id', 'createdAt', 'updatedAt'] as const)
) {}