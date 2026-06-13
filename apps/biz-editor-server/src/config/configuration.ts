export interface AppConfiguration {
  port: number
  mongodbUri: string
}

export default (): AppConfiguration => ({
  port: Number(process.env.PORT ?? 7001),
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/ai_editor',
})
