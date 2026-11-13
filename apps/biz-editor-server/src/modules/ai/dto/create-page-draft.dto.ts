import type { WorkContent } from '@zhangli2008/ai-editor-schema' with { "resolution-mode": "import" }
import { Type } from 'class-transformer'
import { IsIn, IsObject, IsOptional, IsString, Length, MaxLength, ValidateNested } from 'class-validator'

class AiPageContextDto {
  @IsOptional()
  @IsObject()
  content?: WorkContent
}

export class CreatePageDraftDto {
  @IsIn(['brand', 'product', 'signup', 'promotion', 'launch', 'recruitment', 'custom'])
  scene!: 'brand' | 'product' | 'signup' | 'promotion' | 'launch' | 'recruitment' | 'custom'

  @IsString()
  @Length(2, 80)
  topic!: string

  @IsString()
  @Length(2, 120)
  audience!: string

  @IsString()
  @Length(2, 160)
  goal!: string

  @IsString()
  @Length(2, 80)
  tone!: string

  @IsOptional()
  @IsString()
  @Length(2, 300)
  instruction?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => AiPageContextDto)
  context?: AiPageContextDto
}
