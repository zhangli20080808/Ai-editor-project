import { Controller, Get, Query, UseGuards } from '@nestjs/common'

import { AuthGuard } from '../auth/auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { AuthUser } from './users.service'
import { UsersService } from './users.service'

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  search(
    @Query('keyword') keyword = '',
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.usersService.search(keyword, currentUser)
  }
}
