import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
// import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    // PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lottery-system-secret',
      signOptions: { expiresIn: '24h' },
    }),
    AdminModule,
  ],
  providers: [
    AuthService, 
    // JwtStrategy, 
    JwtAuthGuard, 
    RolesGuard, 
    OptionalJwtAuthGuard
  ],
  exports: [
    AuthService, 
    JwtModule, 
    // PassportModule, 
    JwtAuthGuard, 
    RolesGuard, 
    OptionalJwtAuthGuard
  ],
})
export class AuthModule {}