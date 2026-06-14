import { notFound } from 'next/navigation'

import type { PublishedWork } from './types'

const defaultApiBaseUrl = 'http://127.0.0.1:7001/api'
const apiBaseUrl =
  process.env.H5_API_BASE_URL?.replace(/\/$/, '') ?? defaultApiBaseUrl

export async function getPublishedWork(uuid: string) {
  const response = await fetch(`${apiBaseUrl}/public/works/${uuid}`, {
    cache: 'no-store',
  })

  if (response.status === 404) {
    notFound()
  }

  if (!response.ok) {
    throw new Error('获取作品失败')
  }

  return (await response.json()) as PublishedWork
}
