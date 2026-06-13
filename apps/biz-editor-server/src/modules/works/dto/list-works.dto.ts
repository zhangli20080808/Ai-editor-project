import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator'

import { WorkStatus } from '../schemas/work.schema'

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return value
}

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  return Number(value)
}

export class ListWorksDto {
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isTemplate?: boolean

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isHot?: boolean

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPublic?: boolean

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsEnum(WorkStatus)
  status?: WorkStatus

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  pageSize?: number
}
