import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AdminAuditModule } from '../admin-audit/admin-audit.module'
import { AuthModule } from '../auth/auth.module'
import { UsersModule } from '../users/users.module'
import { AdminWorksController } from './admin-works.controller'
import { AdminWorksService } from './admin-works.service'
import { Work, WorkSchema } from './schemas/work.schema'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AdminAuditModule,
    MongooseModule.forFeature([{ name: Work.name, schema: WorkSchema }]),
  ],
  controllers: [AdminWorksController],
  providers: [AdminWorksService],
})
export class AdminWorksModule {}
