'use client'

import { useEffect } from 'react'
import { recordWorkVisit } from './api'

export function VisitReporter({ uuid }: { uuid: string }) {
  useEffect(() => {
    const channel = new URLSearchParams(window.location.search).get('channel') ?? ''

    void recordWorkVisit({
      uuid,
      eventName: 'page_view',
      channel,
      referer: document.referrer,
      userAgent: navigator.userAgent,
    }).catch(() => {
      // PV 上报失败不影响 H5 页面访问。
    })
  }, [uuid])

  return null
}
