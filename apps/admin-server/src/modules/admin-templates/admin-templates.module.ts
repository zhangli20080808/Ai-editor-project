import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AdminAuditModule } from '../admin-audit/admin-audit.module'
import { Work, WorkSchema } from '../admin-works/schemas/work.schema'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { AdminTemplatesController } from './admin-templates.controller'
import { AdminTemplatesService } from './admin-templates.service'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AdminAuditModule,
    MongooseModule.forFeature([{ name: Work.name, schema: WorkSchema }]),
  ],
  controllers: [AdminTemplatesController],
  providers: [AdminTemplatesService],
})
export class AdminTemplatesModule {}
