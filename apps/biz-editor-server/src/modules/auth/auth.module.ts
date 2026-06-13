import { Module } from '@nestjs/common'

import { UsersModule } from '../users/users.module'
import { AuthController } from './auth.controller'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { AuthTokenService } from './auth-token.service'

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AuthTokenService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
