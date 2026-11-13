export interface AppConfiguration {
  port: number
  mongodbUri: string
  authSecret: string
}

export default (): AppConfiguration => ({
  port: Number(process.env.PORT ?? 7003),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor',
  authSecret: process.env.AUTH_SECRET ?? 'ai-editor-local-auth-secret',
})
