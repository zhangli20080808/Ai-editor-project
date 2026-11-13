import { Module } from '@nestjs/common'

import { UsersModule } from '../users/users.module'
import { AdminAuthGuard } from './admin-auth.guard'
import { AuthTokenService } from './auth-token.service'

@Module({
  imports: [UsersModule],
  providers: [AuthTokenService, AdminAuthGuard],
  exports: [AuthTokenService, AdminAuthGuard],
})
export class AuthModule {}
