import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { PublicWorksController } from './public-works.controller'
import { Work, WorkSchema } from './schemas/work.schema'
import { WorksController } from './works.controller'
import { WorksService } from './works.service'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Work.name, schema: WorkSchema }]),
  ],
  controllers: [WorksController, PublicWorksController],
  providers: [WorksService],
})
export class WorksModule {}
