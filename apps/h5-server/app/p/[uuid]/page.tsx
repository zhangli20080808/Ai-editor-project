import type { Metadata } from 'next'

import {
  getPublishedWork,
  PublicWorkUnavailableError,
} from '../../../src/api'
import { H5Renderer } from '../../../src/H5Renderer'
import { VisitReporter } from '../../../src/VisitReporter'
import type { PublicWorkUnavailableCode } from '../../../src/types'

interface PageProps {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uuid } = await params
  const workResult = await getWorkResult(uuid)

  if (!workResult.available) {
    const unavailable = getUnavailableView(workResult.code)

    return {
      title: unavailable.title,
      description: unavailable.description,
      robots: {
        follow: false,
        index: false,
      },
    }
  }

  const work = workResult.work
  const description = work.desc || 'Ai Editor H5 page'

  return {
    title: work.title,
    description,
    openGraph: {
      title: work.title,
      description,
      images: getOpenGraphImages(work.coverImg),
      type: 'website',
    },
    twitter: {
      card: work.coverImg ? 'summary_large_image' : 'summary',
      title: work.title,
      description,
      images: getOpenGraphImages(work.coverImg),
    },
  }
}

export default async function H5WorkPage({ params }: PageProps) {
  const { uuid } = await params
  const workResult = await getWorkResult(uuid)

  if (!workResult.available) {
    return <UnavailableWorkPage code={workResult.code} />
  }

  return (
    <>
      <VisitReporter uuid={workResult.work.uuid} />
      <H5Renderer content={workResult.work.publishedContent} />
    </>
  )
}

type WorkResult =
  | {
      available: true
      work: Awaited<ReturnType<typeof getPublishedWork>>
    }
  | {
      available: false
      code: PublicWorkUnavailableCode
    }

async function getWorkResult(uuid: string): Promise<WorkResult> {
  try {
    return {
      available: true,
      work: await getPublishedWork(uuid),
    }
  } catch (error) {
    if (error instanceof PublicWorkUnavailableError) {
      return {
        available: false,
        code: error.code,
      }
    }

    throw error
  }
}

function UnavailableWorkPage({ code }: { code: PublicWorkUnavailableCode }) {
  const unavailable = getUnavailableView(code)

  return (
    <main className="h5-unavailable">
      <div className="h5-unavailable-icon">{unavailable.icon}</div>
      <h1>{unavailable.title}</h1>
      <p>{unavailable.description}</p>
    </main>
  )
}

function getUnavailableView(code: PublicWorkUnavailableCode) {
  const views: Record<
    PublicWorkUnavailableCode,
    { description: string; icon: string; title: string }
  > = {
    WORK_DELETED: {
      description: '该作品已被作者删除，暂时不能继续访问。',
      icon: 'DEL',
      title: '作品已删除',
    },
    WORK_FORCE_OFFLINE: {
      description: '该作品因内容审核或管理原因已下线。',
      icon: 'OFF',
      title: '作品已下线',
    },
    WORK_NO_PUBLISHED_CONTENT: {
      description: '该作品还没有可展示的发布快照。',
      icon: 'PUB',
      title: '作品暂无发布内容',
    },
    WORK_NOT_FOUND: {
      description: '请确认链接是否完整，或联系作品创建者重新获取地址。',
      icon: '404',
      title: '作品不存在',
    },
    WORK_UNAVAILABLE: {
      description: '作品当前状态不可访问，请稍后再试。',
      icon: 'H5',
      title: '作品暂不可访问',
    },
    WORK_UNPUBLISHED: {
      description: '该作品仍是草稿，作者发布后才可以访问。',
      icon: 'DRAFT',
      title: '作品尚未发布',
    },
  }

  return views[code]
}

function getOpenGraphImages(coverImg: string) {
  return isHttpUrl(coverImg) ? [coverImg] : undefined
}

function isHttpUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://')
}
