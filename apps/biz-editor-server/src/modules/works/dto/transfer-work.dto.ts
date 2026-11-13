import { IsMongoId } from 'class-validator'

export class TransferWorkDto {
  @IsMongoId()
  targetUserId!: string
}
