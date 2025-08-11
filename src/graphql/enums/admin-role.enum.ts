import { registerEnumType } from '@nestjs/graphql';
import { AdminRole } from '@prisma/client';

// Register AdminRole enum with GraphQL
registerEnumType(AdminRole, {
  name: 'AdminRole',
  description: 'Admin role enumeration',
});

export { AdminRole };