import type {
  PublicWorkUnavailableCode,
  PublishedWork,
  WorkStatus,
} from './types'

const defaultApiBaseUrl = 'http://127.0.0.1:7001/api'
const apiBaseUrl =
  process.env.H5_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl

export class PublicWorkUnavailableError extends Error {
  code: PublicWorkUnavailableCode
  workStatus: WorkStatus | undefined

  constructor(
    code: PublicWorkUnavailableCode,
    message: string,
    workStatus?: WorkStatus,
  ) {
    super(message)
    this.name = 'PublicWorkUnavailableError'
    this.code = code
    this.workStatus = workStatus
  }
}

export async function getPublishedWork(uuid: string) {
  const response = await fetch(`${apiBaseUrl}/public/works/${uuid}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    const errorBody = await parseJson(response)
    const publicError = normalizePublicError(errorBody)
    throw new PublicWorkUnavailableError(
      publicError.code,
      publicError.message,
      publicError.status,
    )
  }

  if (!response.ok) {
    throw new Error('获取作品失败')
  }

  return (await response.json()) as PublishedWork
}

export async function recordWorkVisit(payload: {
  componentId?: string
  componentLabel?: string
  componentName?: string
  eventName?: string
  channel?: string
  referer?: string
  userAgent?: string
  uuid: string
}) {
  await fetch(`${apiBaseUrl}/public/works/${payload.uuid}/visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      componentId: payload.componentId,
      componentLabel: payload.componentLabel,
      componentName: payload.componentName,
      eventName: payload.eventName,
      channel: payload.channel,
      referer: payload.referer,
      userAgent: payload.userAgent,
    }),
    cache: 'no-store',
  })
}

async function parseJson(response: Response) {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function normalizePublicError(body: unknown): {
  code: PublicWorkUnavailableCode
  message: string
  status?: WorkStatus
} {
  if (isPublicErrorBody(body)) {
    return body
  }

  if (
    isRecord(body) &&
    isPublicErrorBody(body.message)
  ) {
    return body.message
  }

  if (isRecord(body) && typeof body.message === 'string') {
    return {
      code: 'WORK_UNAVAILABLE',
      message: body.message,
    }
  }

  return {
    code: 'WORK_UNAVAILABLE',
    message: '作品暂不可访问',
  }
}

function isPublicErrorBody(value: unknown): value is {
  code: PublicWorkUnavailableCode
  message: string
  status?: WorkStatus
} {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
