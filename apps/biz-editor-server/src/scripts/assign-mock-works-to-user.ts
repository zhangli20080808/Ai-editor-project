import mongoose from 'mongoose'

import { User, UserSchema, UserType } from '../modules/users/schemas/user.schema'
import { Work, WorkSchema } from '../modules/works/schemas/work.schema'

const mongodbUri =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor'
const phoneNumber = process.env.MOCK_USER_PHONE ?? '13800138000'

async function main() {
  await mongoose.connect(mongodbUri)

  const UserModel = mongoose.model(User.name, UserSchema)
  const WorkModel = mongoose.model(Work.name, WorkSchema)
  const user = await UserModel.findOneAndUpdate(
    { phoneNumber },
    {
      $setOnInsert: {
        username: phoneNumber,
        phoneNumber,
        nickName: `用户${phoneNumber.slice(-4)}`,
        type: UserType.Cellphone,
      },
    },
    {
      new: true,
      upsert: true,
    },
  ).exec()

  const result = await WorkModel.updateMany(
    {
      author: 'mock-user',
      $or: [{ user: null }, { user: { $exists: false } }],
    },
    {
      $set: {
        user: user._id,
        author: user.nickName || user.username,
      },
    },
  ).exec()

  console.log(
    `Assigned ${result.modifiedCount} mock works to ${user.phoneNumber}.`,
  )
  await mongoose.disconnect()
}

void main().catch(async (error) => {
  console.error(error)
  await mongoose.disconnect()
  process.exit(1)
})
