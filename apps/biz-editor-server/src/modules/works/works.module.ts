import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { PublicWorksController } from './public-works.controller'
import { WorkVisit, WorkVisitSchema } from './schemas/work-visit.schema'
import { Work, WorkSchema } from './schemas/work.schema'
import { WorksController } from './works.controller'
import { WorksService } from './works.service'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Work.name, schema: WorkSchema },
      { name: WorkVisit.name, schema: WorkVisitSchema },
    ]),
  ],
  controllers: [WorksController, PublicWorksController],
  providers: [WorksService],
})
export class WorksModule {}
