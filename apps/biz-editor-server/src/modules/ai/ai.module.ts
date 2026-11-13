import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'
import { AiRun, AiRunSchema } from './schemas/ai-run.schema'

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: AiRun.name, schema: AiRunSchema }])],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
