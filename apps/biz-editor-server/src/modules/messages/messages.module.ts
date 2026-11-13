import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AuthModule } from '../auth/auth.module'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { Message, MessageSchema } from './schemas/message.schema'

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
