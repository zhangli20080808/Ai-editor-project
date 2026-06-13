import { ApiError } from './types'
import { getAuthToken } from './authStorage'

const defaultApiBaseUrl = 'http://127.0.0.1:7001/api'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, boolean | number | string | null | undefined>
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { body, headers, params, ...requestOptions } = options
  const authToken = getAuthToken()
  const init: RequestInit = {
    ...requestOptions,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  }

  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const response = await fetch(buildUrl(path, params), init)

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data), response.status, data)
  }

  return data as T
}

function buildUrl(
  path: string,
  params?: Record<string, boolean | number | string | null | undefined>,
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${apiBaseUrl}${normalizedPath}`)

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })

  return url.toString()
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function getErrorMessage(data: unknown) {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message
    return Array.isArray(message) ? message.join('；') : String(message)
  }

  return '请求失败'
}
