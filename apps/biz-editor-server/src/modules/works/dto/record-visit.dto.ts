import { IsOptional, IsString, MaxLength } from 'class-validator'

export class RecordVisitDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  eventName?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  channel?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  componentId?: string

  @IsOptional()
  @IsString()
  @MaxLength(40)
  componentName?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  componentLabel?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referer?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  userAgent?: string
}
