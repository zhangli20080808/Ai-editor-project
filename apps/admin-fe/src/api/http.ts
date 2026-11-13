import { clearAuthToken, getAuthToken } from './authStorage'
import { ApiError } from './types'

const defaultAuthApiBaseUrl = 'http://127.0.0.1:7001/api'
const defaultAdminApiBaseUrl = 'http://127.0.0.1:7003/api'

const authApiBaseUrl =
  import.meta.env.VITE_AUTH_API_BASE_URL?.replace(/\/$/, '') ??
  defaultAuthApiBaseUrl
const adminApiBaseUrl =
  import.meta.env.VITE_ADMIN_API_BASE_URL?.replace(/\/$/, '') ??
  defaultAdminApiBaseUrl

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, boolean | number | string | null | undefined>
}

export function authRequest<T>(path: string, options: RequestOptions = {}) {
  return request<T>(authApiBaseUrl, path, options)
}

export function adminRequest<T>(path: string, options: RequestOptions = {}) {
  return request<T>(adminApiBaseUrl, path, options)
}

async function request<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions,
) {
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

  const response = await fetch(buildUrl(baseUrl, path, params), init)
  const data = await parseResponse(response)

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthToken()
    }
    throw new ApiError(getErrorMessage(data), response.status, data)
  }

  return data as T
}

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, boolean | number | string | null | undefined>,
) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${baseUrl}${normalizedPath}`)

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
