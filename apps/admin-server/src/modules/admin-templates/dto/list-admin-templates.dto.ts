import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  if (value === 'true' || value === true) return true
  if (value === 'false' || value === false) return false
  return value
}

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  return Number(value)
}

export class ListAdminTemplatesDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isPublic?: boolean

  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isHot?: boolean

  @IsOptional()
  @IsString()
  templateTag?: string

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
