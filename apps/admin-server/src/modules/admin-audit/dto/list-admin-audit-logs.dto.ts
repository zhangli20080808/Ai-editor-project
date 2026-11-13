import { Transform } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import {
  AdminAuditAction,
  AdminAuditTargetType,
} from '../schemas/admin-audit-log.schema'

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined
  return Number(value)
}

export class ListAdminAuditLogsDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsEnum(AdminAuditAction)
  action?: AdminAuditAction

  @IsOptional()
  @IsEnum(AdminAuditTargetType)
  targetType?: AdminAuditTargetType

  @IsOptional()
  @IsString()
  targetUuid?: string

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
