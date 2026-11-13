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
import { AdminTemplatesService } from './admin-templates.service'
import { ListAdminTemplatesDto } from './dto/list-admin-templates.dto'
import { TemplateActionDto } from './dto/template-action.dto'

@UseGuards(AdminAuthGuard)
@Controller('admin/templates')
export class AdminTemplatesController {
  constructor(
    private readonly adminTemplatesService: AdminTemplatesService,
  ) {}

  @Get()
  findAll(@Query() query: ListAdminTemplatesDto) {
    return this.adminTemplatesService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminTemplatesService.findOne(id)
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() body: TemplateActionDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminTemplatesService.publish(id, body, currentUser)
  }

  @Post(':id/unpublish')
  unpublish(
    @Param('id') id: string,
    @Body() body: TemplateActionDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminTemplatesService.unpublish(id, body, currentUser)
  }

  @Post(':id/recommend')
  recommend(
    @Param('id') id: string,
    @Body() body: TemplateActionDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminTemplatesService.recommend(id, body, currentUser)
  }

  @Post(':id/cancel-recommend')
  cancelRecommend(
    @Param('id') id: string,
    @Body() body: TemplateActionDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.adminTemplatesService.cancelRecommend(id, body, currentUser)
  }
}
