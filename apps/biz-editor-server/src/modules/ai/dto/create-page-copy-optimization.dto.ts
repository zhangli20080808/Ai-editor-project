import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator'

class PageCopyComponentDto {
  @IsString()
  @Length(1, 100)
  id!: string

  @IsIn(['l-text', 'l-button'])
  componentType!: 'l-text' | 'l-button'

  @IsString()
  @Length(1, 500)
  text!: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string
}

export class CreatePageCopyOptimizationDto {
  @IsString()
  @Length(1, 80)
  pageTitle!: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  pageDescription?: string

  @IsIn(['brand', 'conversion', 'concise', 'custom'])
  objective!: 'brand' | 'conversion' | 'concise' | 'custom'

  @IsOptional()
  @IsString()
  @Length(2, 200)
  instruction?: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PageCopyComponentDto)
  components!: PageCopyComponentDto[]
}
