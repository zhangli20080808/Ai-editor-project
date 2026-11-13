import { ApiError } from './types'

export function getRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '请求失败'
}
