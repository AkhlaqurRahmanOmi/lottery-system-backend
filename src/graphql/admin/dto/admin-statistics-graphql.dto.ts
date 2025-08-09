import { Field, ObjectType, Int } from '@nestjs/graphql';

/**
 * GraphQL object type for admin statistics
 */
@ObjectType('AdminStatistics')
export class AdminStatisticsGraphQLDto {
  @Field(() => Int, {
    description: 'Total number of admin accounts'
  })
  total: number;

  @Field(() => Int, {
    description: 'Number of active admin accounts'
  })
  active: number;

  @Field(() => Int, {
    description: 'Number of inactive admin accounts'
  })
  inactive: number;

  @Field(() => Int, {
    description: 'Number of super admin accounts'
  })
  superAdmins: number;

  @Field(() => Int, {
    description: 'Number of regular admin accounts'
  })
  regularAdmins: number;
}