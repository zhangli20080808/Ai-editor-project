import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { AdminAuditController } from './admin-audit.controller'
import { AdminAuditService } from './admin-audit.service'
import {
  AdminAuditLog,
  AdminAuditLogSchema,
} from './schemas/admin-audit-log.schema'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: AdminAuditLog.name, schema: AdminAuditLogSchema },
    ]),
  ],
  controllers: [AdminAuditController],
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
