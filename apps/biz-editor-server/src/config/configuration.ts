export interface AppConfiguration {
  port: number
  mongodbUri: string
  authSecret: string
  mockSmsCode: string
}

export default (): AppConfiguration => ({
  port: Number(process.env.PORT ?? 7001),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor',
  authSecret: process.env.AUTH_SECRET ?? 'ai-editor-local-auth-secret',
  mockSmsCode: process.env.MOCK_SMS_CODE ?? '123456',
})
