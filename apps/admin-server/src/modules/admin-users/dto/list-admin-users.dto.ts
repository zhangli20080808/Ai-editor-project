import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import { UserRole, UserStatus } from '../../users/schemas/user.schema'

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  return Number(value)
}

export class ListAdminUsersDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

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
