import type { Metadata } from 'next'

import { getPublishedWork } from '../../../src/api'
import { H5Renderer } from '../../../src/H5Renderer'

interface PageProps {
  params: Promise<{
    uuid: string
  }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { uuid } = await params
  const work = await getPublishedWork(uuid)

  return {
    title: work.title,
    description: work.desc || 'Ai Editor H5 page',
    openGraph: {
      title: work.title,
      description: work.desc || 'Ai Editor H5 page',
      images: work.coverImg ? [work.coverImg] : undefined,
    },
  }
}

export default async function H5WorkPage({ params }: PageProps) {
  const { uuid } = await params
  const work = await getPublishedWork(uuid)

  return <H5Renderer content={work.publishedContent} />
}
