import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'

import { ListWorksDto } from './dto/list-works.dto'
import { RecordVisitDto } from './dto/record-visit.dto'
import { WorksService } from './works.service'

@Controller('public/works')
export class PublicWorksController {
  constructor(private readonly worksService: WorksService) {}

  @Get('templates')
  findPublicTemplates(@Query() query: ListWorksDto) {
    return this.worksService.findPublicTemplates(query)
  }

  @Get('templates/:id')
  findPublicTemplate(@Param('id') id: string) {
    return this.worksService.findPublicTemplateByIdentity(id)
  }

  @Get('cases')
  findPublicCases(@Query() query: ListWorksDto) {
    return this.worksService.findPublicCases(query)
  }

  @Get(':uuid')
  findPublishedWork(@Param('uuid') uuid: string) {
    return this.worksService.findPublishedByUuid(uuid)
  }

  @Post(':uuid/visit')
  recordVisit(
    @Param('uuid') uuid: string,
    @Body() recordVisitDto: RecordVisitDto,
  ) {
    return this.worksService.recordVisit(uuid, recordVisitDto)
  }
}
