import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { AdminAuthGuard } from '../auth/admin-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { type AuthUser } from '../users/users.service'
import { AdminUsersService } from './admin-users.service'
import { FreezeUserDto } from './dto/freeze-user.dto'
import { ListAdminUsersDto } from './dto/list-admin-users.dto'
import { UnfreezeUserDto } from './dto/unfreeze-user.dto'

@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(@Query() query: ListAdminUsersDto) {
    return this.adminUsersService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id)
  }

  @Post(':id/freeze')
  freeze(
    @Param('id') id: string,
    @Body() body: FreezeUserDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminUsersService.freeze(id, body, currentUser)
  }

  @Post(':id/unfreeze')
  unfreeze(
    @Param('id') id: string,
    @Body() body: UnfreezeUserDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminUsersService.unfreeze(id, body, currentUser)
  }
}
