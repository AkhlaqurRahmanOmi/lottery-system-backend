import { PrismaClient, AdminRole, ConfigType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@lottery.com',
      passwordHash: adminPassword,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', { id: admin.id, username: admin.username, email: admin.email });

  // Create default rewards
  const rewards = [
    {
      name: 'Premium Gift Voucher',
      description: 'A premium gift voucher worth $100',
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Electronics Bundle',
      description: 'Latest electronics including headphones and accessories',
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Luxury Spa Package',
      description: 'Relaxing spa experience with full treatment package',
      displayOrder: 3,
      isActive: true,
    },
    {
      name: 'Travel Voucher',
      description: 'Travel voucher for domestic flights and accommodation',
      displayOrder: 4,
      isActive: true,
    },
    {
      name: 'Shopping Credit',
      description: '$50 shopping credit for online purchases',
      displayOrder: 5,
      isActive: true,
    },
  ];

  // Check if rewards already exist, if not create them
  const existingRewardsCount = await prisma.reward.count();
  if (existingRewardsCount === 0) {
    for (const rewardData of rewards) {
      const reward = await prisma.reward.create({
        data: rewardData,
      });
      console.log('✅ Created reward:', { id: reward.id, name: reward.name });
    }
  } else {
    console.log('✅ Rewards already exist, skipping creation');
  }

  // Create system configurations
  const systemConfigs = [
    {
      configKey: 'COUPON_DEFAULT_LENGTH',
      configValue: '10',
      configType: ConfigType.NUMBER,
      description: 'Default length for generated coupon codes',
    },
    {
      configKey: 'COUPON_MAX_BATCH_SIZE',
      configValue: '1000',
      configType: ConfigType.NUMBER,
      description: 'Maximum number of coupons that can be generated in a single batch',
    },
    {
      configKey: 'COUPON_DEFAULT_EXPIRY_DAYS',
      configValue: '30',
      configType: ConfigType.NUMBER,
      description: 'Default expiry period for coupons in days',
    },
    {
      configKey: 'SYSTEM_MAINTENANCE_MODE',
      configValue: 'false',
      configType: ConfigType.BOOLEAN,
      description: 'Enable/disable system maintenance mode',
    },
    {
      configKey: 'ALLOWED_CHARACTERS',
      configValue: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
      configType: ConfigType.STRING,
      description: 'Characters allowed in coupon code generation (excludes ambiguous characters)',
    },
    {
      configKey: 'MAX_GENERATION_RETRIES',
      configValue: '10',
      configType: ConfigType.NUMBER,
      description: 'Maximum number of retries when generating unique coupon codes',
    },
    {
      configKey: 'RATE_LIMIT_REQUESTS_PER_MINUTE',
      configValue: '60',
      configType: ConfigType.NUMBER,
      description: 'Rate limit for API requests per minute per IP',
    },
    {
      configKey: 'JWT_ACCESS_TOKEN_EXPIRY',
      configValue: '15m',
      configType: ConfigType.STRING,
      description: 'JWT access token expiry time',
    },
    {
      configKey: 'JWT_REFRESH_TOKEN_EXPIRY',
      configValue: '7d',
      configType: ConfigType.STRING,
      description: 'JWT refresh token expiry time',
    },
    {
      configKey: 'EXPORT_MAX_RECORDS',
      configValue: '10000',
      configType: ConfigType.NUMBER,
      description: 'Maximum number of records allowed in data exports',
    },
  ];

  for (const configData of systemConfigs) {
    const config = await prisma.systemConfig.upsert({
      where: { configKey: configData.configKey },
      update: {},
      create: configData,
    });
    console.log('✅ Created system config:', { key: config.configKey, value: config.configValue });
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });