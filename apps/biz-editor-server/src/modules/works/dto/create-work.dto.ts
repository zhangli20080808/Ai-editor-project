import {
  IsBoolean,
  IsEnum,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import type { WorkContent } from '@zhangli2008/ai-editor-schema' with {
  "resolution-mode": "import"
}

import { WorkStatus } from '../schemas/work.schema'

export class CreateWorkDto {
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
  @MaxLength(1_500_000)
  coverImg?: string

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateTags?: string[]

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
