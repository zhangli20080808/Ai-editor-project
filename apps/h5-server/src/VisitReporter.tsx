'use client'

import { useEffect } from 'react'

const defaultApiBaseUrl = 'http://127.0.0.1:7001/api'
const apiBaseUrl =
  process.env.NEXT_PUBLIC_H5_API_BASE_URL?.replace(/\/$/, '') ??
  defaultApiBaseUrl

export function VisitReporter({ uuid }: { uuid: string }) {
  useEffect(() => {
    const channel = new URLSearchParams(window.location.search).get('channel') ?? ''

    void fetch(`${apiBaseUrl}/public/works/${uuid}/visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel,
        referer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {
      // PV 上报失败不影响 H5 页面访问。
    })
  }, [uuid])

  return null
}
