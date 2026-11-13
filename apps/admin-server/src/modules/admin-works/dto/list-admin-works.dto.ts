import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import { WorkStatus } from '../schemas/work.schema'

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  return Number(value)
}

export class ListAdminWorksDto {
  @IsOptional()
  @IsString()
  keyword?: string

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
