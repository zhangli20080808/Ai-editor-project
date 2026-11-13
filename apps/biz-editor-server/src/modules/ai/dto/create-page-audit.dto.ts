import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

class PageAuditComponentDto {
  @IsString()
  @Length(1, 100)
  id!: string

  @IsIn(['l-text', 'l-image', 'l-button'])
  componentType!: 'l-text' | 'l-image' | 'l-button'

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  text?: string

  @IsNumber()
  @Min(0)
  @Max(5000)
  top!: number

  @IsNumber()
  @Min(0)
  @Max(1000)
  left!: number

  @IsNumber()
  @Min(1)
  @Max(1000)
  width!: number

  @IsNumber()
  @Min(1)
  @Max(5000)
  height!: number

  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(120)
  fontSize?: number

  @IsBoolean()
  hasClickAction!: boolean
}

export class CreatePageAuditDto {
  @IsString()
  @Length(1, 80)
  pageTitle!: string

  @IsOptional()
  @IsString()
  @MaxLength(160)
  pageDescription?: string

  @IsNumber()
  @Min(320)
  @Max(5000)
  pageHeight!: number

  @IsString()
  @MaxLength(40)
  backgroundColor!: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PageAuditComponentDto)
  components!: PageAuditComponentDto[]
}
