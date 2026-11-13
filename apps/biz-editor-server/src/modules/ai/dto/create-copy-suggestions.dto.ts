import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator'

export class CreateCopySuggestionsDto {
  @IsIn(['l-text', 'l-button'])
  componentType!: 'l-text' | 'l-button'

  @IsString()
  @Length(1, 500)
  text!: string

  @IsIn(['shorten', 'polish', 'action', 'tone', 'custom'])
  mode!: 'shorten' | 'polish' | 'action' | 'tone' | 'custom'

  @IsOptional()
  @IsString()
  @MaxLength(80)
  pageTitle?: string

  @IsOptional()
  @IsString()
  @Length(2, 200)
  instruction?: string
}
