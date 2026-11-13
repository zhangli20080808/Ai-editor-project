export interface AppConfiguration {
  port: number
  mongodbUri: string
  authSecret: string
  mockSmsCode: string
  h5BaseUrl: string
  llmApiBaseUrl: string
  llmApiKey: string
  llmModel: string
}

export default (): AppConfiguration => ({
  port: Number(process.env.PORT ?? 7001),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor',
  authSecret: process.env.AUTH_SECRET ?? 'ai-editor-local-auth-secret',
  mockSmsCode: process.env.MOCK_SMS_CODE ?? '123456',
  h5BaseUrl: process.env.H5_BASE_URL ?? 'http://127.0.0.1:7002',
  llmApiBaseUrl: process.env.LLM_API_BASE_URL ?? '',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmModel: process.env.LLM_MODEL ?? '',
})
