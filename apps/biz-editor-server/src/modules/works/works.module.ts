import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { MessagesModule } from '../messages/messages.module'
import { UsersModule } from '../users/users.module'
import { PublicWorksController } from './public-works.controller'
import { WorkVisit, WorkVisitSchema } from './schemas/work-visit.schema'
import { WorkFavorite, WorkFavoriteSchema } from './schemas/work-favorite.schema'
import { Work, WorkSchema } from './schemas/work.schema'
import { WorksController } from './works.controller'
import { WorksService } from './works.service'

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MessagesModule,
    MongooseModule.forFeature([
      { name: Work.name, schema: WorkSchema },
      { name: WorkVisit.name, schema: WorkVisitSchema },
      { name: WorkFavorite.name, schema: WorkFavoriteSchema },
    ]),
  ],
  controllers: [WorksController, PublicWorksController],
  providers: [WorksService],
})
export class WorksModule {}
