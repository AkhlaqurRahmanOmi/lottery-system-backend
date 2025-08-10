import { OmitType } from '@nestjs/swagger';
import { InputType } from '@nestjs/graphql';
import { RewardBaseDto } from './reward-base.dto';

export class CreateRewardDto extends OmitType(RewardBaseDto, ['id', 'createdAt', 'updatedAt'] as const) {}

@InputType()
export class CreateRewardInput extends OmitType(RewardBaseDto, ['id', 'createdAt', 'updatedAt'] as const) {}