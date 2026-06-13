import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { Work, WorkSchema } from './schemas/work.schema'
import { WorksController } from './works.controller'
import { WorksService } from './works.service'

@Module({
  imports: [MongooseModule.forFeature([{ name: Work.name, schema: WorkSchema }])],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
