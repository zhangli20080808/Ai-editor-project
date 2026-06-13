import { ApiError } from './types'

export function getRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return `参数有误：${error.message}`
    }

    if (error.status === 401) {
      return '登录已过期，请重新登录后再操作'
    }

    if (error.status === 403) {
      return '当前账号没有权限执行该操作'
    }

    if (error.status === 404) {
      return '作品不存在或已被删除'
    }

    if (error.status >= 500) {
      return '服务端暂时不可用，请稍后重试'
    }

    return error.message
  }

  if (error instanceof TypeError) {
    return '网络连接失败，请确认后端服务是否已启动'
  }

  if (error instanceof Error) {
    return error.message
  }

  return '操作失败，请稍后重试'
}
