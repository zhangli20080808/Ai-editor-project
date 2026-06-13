import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import { CreateWorkDto } from './dto/create-work.dto'
import { ListWorksDto } from './dto/list-works.dto'
import { UpdateWorkDto } from './dto/update-work.dto'
import { WorksService } from './works.service'

@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Post()
  create(@Body() createWorkDto: CreateWorkDto) {
    return this.worksService.create(createWorkDto)
  }

  @Get()
  findAll(@Query() query: ListWorksDto) {
    return this.worksService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.worksService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkDto: UpdateWorkDto) {
    return this.worksService.update(id, updateWorkDto)
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.worksService.publish(id)
  }

  @Post(':id/copy')
  copy(@Param('id') id: string) {
    return this.worksService.copy(id)
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.worksService.softDelete(id)
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.worksService.restore(id)
  }
}
