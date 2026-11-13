import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthUser } from '../users/users.service'
import { MessagesService } from './messages.service'

@UseGuards(AuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findAll(@CurrentUser() currentUser: AuthUser) {
    return this.messagesService.findAll(currentUser)
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() currentUser: AuthUser) {
    return this.messagesService.markAllAsRead(currentUser)
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.messagesService.markAsRead(id, currentUser)
  }
}
