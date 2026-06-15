import { Body, Controller, Get, Param, Post } from '@nestjs/common'

import { RecordVisitDto } from './dto/record-visit.dto'
import { WorksService } from './works.service'

@Controller('public/works')
export class PublicWorksController {
  constructor(private readonly worksService: WorksService) {}

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
