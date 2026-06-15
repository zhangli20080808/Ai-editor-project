import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator'

export class MarkTemplateDto {
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  templateTags?: string[]
}
