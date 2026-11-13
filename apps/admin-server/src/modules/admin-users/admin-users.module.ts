import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AdminAuditModule } from '../admin-audit/admin-audit.module'
import { AuthModule } from '../auth/auth.module'
import { User, UserSchema } from '../users/schemas/user.schema'
import { UsersModule } from '../users/users.module'
import { AdminUsersController } from './admin-users.controller'
import { AdminUsersService } from './admin-users.service'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AdminAuditModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
