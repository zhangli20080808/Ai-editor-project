import { IsString, Matches } from 'class-validator'

export class SendCodeDto {
  @IsString()
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phoneNumber!: string
}
