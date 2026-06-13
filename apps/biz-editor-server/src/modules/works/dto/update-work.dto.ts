import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

import { WorkStatus, type WorkContent } from '../schemas/work.schema'

export class UpdateWorkDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  desc?: string

  @IsOptional()
  @IsObject()
  content?: WorkContent

  @IsOptional()
  @IsString()
  coverImg?: string

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean

  @IsOptional()
  @IsBoolean()
  isHot?: boolean

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @IsOptional()
  @IsEnum(WorkStatus)
  status?: WorkStatus
}
