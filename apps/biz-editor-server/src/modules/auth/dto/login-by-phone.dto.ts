import { IsString, Matches } from 'class-validator'

export class LoginByPhoneDto {
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phoneNumber!: string

  @IsString()
  code!: string
}
