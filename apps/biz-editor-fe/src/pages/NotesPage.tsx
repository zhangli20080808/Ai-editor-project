import { Card, Empty, Space, Tabs, Tag, Timeline, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { apiDocs, type ApiEndpointDoc } from '../data/apiDocs'
import {
  learningNoteCategories,
  learningNotes,
  type LearningNote,
} from '../data/learningNotes'
import {
  technicalPlans,
  type TechnicalPlan,
} from '../data/technicalPlans'

const { Paragraph, Text, Title } = Typography

function NotesPage() {
  const implementationNotes = learningNotes.filter(
    (note) => note.category === '实施计划',
  )
  const developmentNotes = learningNotes.filter(
    (note) => note.category !== '实施计划',
  )
  const developmentCategories = learningNoteCategories.filter(
    (category) => category !== '实施计划',
  )
  const developmentTabItems = [
    {
      key: 'all',
      label: '全部',
      children: <NotesTimeline notes={developmentNotes} />,
    },
    ...developmentCategories.map((category) => ({
      key: category,
      label: category,
      children: (
        <NotesTimeline
          notes={developmentNotes.filter((note) => note.category === category)}
        />
      ),
    })),
  ]
  const topTabItems = [
    {
      key: 'records',
      label: '开发记录',
      children: <Tabs items={developmentTabItems} />,
    },
    {
      key: 'plans',
      label: '实施计划',
      children: <NotesTimeline notes={implementationNotes} />,
    },
    {
      key: 'api-docs',
      label: '接口文档',
      children: <ApiDocsView docs={apiDocs} />,
    },
    {
      key: 'technical-plans',
      label: '技术方案',
      children: <TechnicalPlansView plans={technicalPlans} />,
    },
  ]

  return (
    <main className="workspace-page notes-page">
      <section className="workspace-page-header">
        <div>
          <Text type="secondary">Project Knowledge Base</Text>
          <Title level={3}>开发记录</Title>
          <Paragraph type="secondary">
            记录需求分析、技术方案和每一步编辑器能力演进，方便项目结束时回看完整设计脉络。
          </Paragraph>
        </div>
        <div className="notes-summary">
          <Text strong>
            {learningNotes.length + apiDocs.length + technicalPlans.length}
          </Text>
          <Text type="secondary">条知识</Text>
        </div>
      </section>
      <Card className="workspace-panel">
        <Tabs className="knowledge-tabs" items={topTabItems} />
      </Card>
    </main>
  )
}

interface NotesTimelineProps {
  notes: LearningNote[]
}

function NotesTimeline({ notes }: NotesTimelineProps) {
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id ?? '')
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setActiveNoteId(notes[0]?.id ?? '')
  }, [notes])

  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const articles = Array.from(
      content.querySelectorAll<HTMLElement>('[data-note-id]'),
    )
    if (articles.length === 0) {
      return
    }

    const scrollRoot = content.closest<HTMLElement>('.workspace-page')
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0]

        const noteId = visibleEntry?.target.getAttribute('data-note-id')
        if (noteId) {
          setActiveNoteId(noteId)
        }
      },
      {
        root: scrollRoot,
        rootMargin: '-18% 0px -65% 0px',
        threshold: [0, 0.15, 0.3],
      },
    )

    articles.forEach((article) => observer.observe(article))

    return () => observer.disconnect()
  }, [notes])

  if (notes.length === 0) {
    return <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <div className="notes-reader">
      <aside className="notes-outline" aria-label="开发记录目录">
        <Text type="secondary" className="notes-outline-title">
          当前目录
        </Text>
        <div className="notes-outline-list">
          {notes.map((note, index) => (
            <button
              className={[
                'notes-outline-item',
                activeNoteId === note.id ? 'is-active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={note.id}
              type="button"
              onClick={() => {
                setActiveNoteId(note.id)
                scrollToNote(note.id, contentRef.current)
              }}
            >
              <span className="notes-outline-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="notes-outline-text">{note.title}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="notes-content" ref={contentRef}>
        <Timeline
          className="notes-timeline"
          items={notes.map((note) => ({
            color: activeNoteId === note.id ? '#ff5a3c' : '#d8dde6',
            content: (
              <article
                className="note-entry"
                data-note-id={note.id}
                id={getNoteDomId(note.id)}
              >
                <Space size={8} wrap>
                  <Tag color="volcano">{note.category}</Tag>
                  <Text type="secondary">{note.summary}</Text>
                </Space>
                <Title level={4}>{note.title}</Title>
                <div className="note-grid">
                  <NoteBlock title="背景" content={note.background} />
                  <NoteBlock title="决策" content={note.decision} />
                  <NoteBlock title="当前实现" content={note.implementation} />
                  <NoteBlock title="下一步" content={note.nextStep} />
                </div>
                <div className="note-detail-grid">
                  <NoteList title="目标" items={note.goals} />
                  <NoteList title="关键设计" items={note.keyDesigns} />
                  <NoteList
                    title="实现要点"
                    items={note.implementationDetails}
                  />
                  <NoteList title="验证方式" items={note.tests} />
                </div>
              </article>
            ),
          }))}
        />
      </div>
    </div>
  )
}

interface ApiDocsViewProps {
  docs: ApiEndpointDoc[]
}

function ApiDocsView({ docs }: ApiDocsViewProps) {
  const [activeDocId, setActiveDocId] = useState(docs[0]?.id ?? '')
  const contentRef = useRef<HTMLDivElement | null>(null)

  useActiveOutline({
    activeId: activeDocId,
    contentRef,
    itemSelector: '[data-api-doc-id]',
    onActiveChange: setActiveDocId,
    rootSelector: '.workspace-page',
  })

  if (docs.length === 0) {
    return <Empty description="暂无接口文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <div className="notes-reader">
      <Outline
        activeId={activeDocId}
        items={docs.map((doc) => ({
          id: doc.id,
          title: `${doc.module} / ${doc.title}`,
        }))}
        title="接口目录"
        onSelect={(id) => {
          setActiveDocId(id)
          scrollToKnowledgeItem(`api-doc-${id}`, contentRef.current)
        }}
      />
      <div className="notes-content api-doc-content" ref={contentRef}>
        {docs.map((doc) => (
          <article
            className="api-doc-card"
            data-api-doc-id={doc.id}
            id={`api-doc-${doc.id}`}
            key={doc.id}
          >
            <Space size={8} wrap>
              <Tag color={getMethodColor(doc.method)}>{doc.method}</Tag>
              <Tag>{doc.module}</Tag>
              <Tag color={doc.auth === 'bearer' ? 'blue' : 'default'}>
                {doc.auth === 'bearer' ? 'Bearer Token' : 'Public'}
              </Tag>
            </Space>
            <Title level={4}>{doc.title}</Title>
            <code className="api-path">{doc.path}</code>
            <Paragraph type="secondary">{doc.summary}</Paragraph>
            {doc.request ? (
              <DocSection title="请求参数">
                <div className="api-field-list">
                  {doc.request.map((field) => (
                    <div className="api-field-row" key={field.name}>
                      <Text strong>{field.name}</Text>
                      <Text code>{field.type}</Text>
                      <Tag color={field.required ? 'volcano' : 'default'}>
                        {field.required ? '必填' : '可选'}
                      </Tag>
                      <Text type="secondary">{field.description}</Text>
                    </div>
                  ))}
                </div>
              </DocSection>
            ) : null}
            <div className="doc-section-grid">
              <DocList title="响应结构" items={doc.response} />
              <DocList title="错误情况" items={doc.errors} />
              <DocList title="实现备注" items={doc.notes} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

interface TechnicalPlansViewProps {
  plans: TechnicalPlan[]
}

function TechnicalPlansView({ plans }: TechnicalPlansViewProps) {
  const [activePlanId, setActivePlanId] = useState(plans[0]?.id ?? '')
  const contentRef = useRef<HTMLDivElement | null>(null)

  useActiveOutline({
    activeId: activePlanId,
    contentRef,
    itemSelector: '[data-plan-id]',
    onActiveChange: setActivePlanId,
    rootSelector: '.workspace-page',
  })

  if (plans.length === 0) {
    return <Empty description="暂无技术方案" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <div className="notes-reader">
      <Outline
        activeId={activePlanId}
        items={plans.map((plan) => ({
          id: plan.id,
          title: plan.title,
        }))}
        title="方案目录"
        onSelect={(id) => {
          setActivePlanId(id)
          scrollToKnowledgeItem(`plan-${id}`, contentRef.current)
        }}
      />
      <div className="notes-content technical-plan-content" ref={contentRef}>
        {plans.map((plan) => (
          <article
            className="technical-plan-card"
            data-plan-id={plan.id}
            id={`plan-${plan.id}`}
            key={plan.id}
          >
            <Text type="secondary">{plan.summary}</Text>
            <Title level={4}>{plan.title}</Title>
            <NoteBlock title="适用范围" content={plan.scope} />
            <div className="note-detail-grid">
              <DocList title="架构设计" items={plan.architecture} />
              <DocList title="数据模型" items={plan.dataModel} />
              <DocList title="核心流程" items={plan.flow} />
              <DocList title="取舍说明" items={plan.tradeoffs} />
              <DocList title="验证方式" items={plan.verification} />
              <DocList title="后续扩展" items={plan.next} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

interface OutlineProps {
  activeId: string
  items: Array<{ id: string; title: string }>
  title: string
  onSelect: (id: string) => void
}

function Outline({ activeId, items, onSelect, title }: OutlineProps) {
  return (
    <aside className="notes-outline" aria-label={title}>
      <Text type="secondary" className="notes-outline-title">
        {title}
      </Text>
      <div className="notes-outline-list">
        {items.map((item, index) => (
          <button
            className={[
              'notes-outline-item',
              activeId === item.id ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
          >
            <span className="notes-outline-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="notes-outline-text">{item.title}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

interface UseActiveOutlineOptions {
  activeId: string
  contentRef: RefObject<HTMLDivElement | null>
  itemSelector: string
  onActiveChange: (id: string) => void
  rootSelector: string
}

function useActiveOutline({
  activeId,
  contentRef,
  itemSelector,
  onActiveChange,
  rootSelector,
}: UseActiveOutlineOptions) {
  useEffect(() => {
    const content = contentRef.current
    if (!content) {
      return
    }

    const articles = Array.from(content.querySelectorAll<HTMLElement>(itemSelector))
    if (articles.length === 0) {
      return
    }

    const scrollRoot = content.closest<HTMLElement>(rootSelector)
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (left, right) =>
              left.boundingClientRect.top - right.boundingClientRect.top,
          )[0]
        const nextId =
          visibleEntry?.target.getAttribute('data-api-doc-id') ??
          visibleEntry?.target.getAttribute('data-plan-id')

        if (nextId && nextId !== activeId) {
          onActiveChange(nextId)
        }
      },
      {
        root: scrollRoot,
        rootMargin: '-18% 0px -65% 0px',
        threshold: [0, 0.15, 0.3],
      },
    )

    articles.forEach((article) => observer.observe(article))

    return () => observer.disconnect()
  }, [activeId, contentRef, itemSelector, onActiveChange, rootSelector])
}

function scrollToNote(noteId: string, content: HTMLElement | null) {
  scrollToKnowledgeItem(getNoteDomId(noteId), content)
}

function scrollToKnowledgeItem(elementId: string, content: HTMLElement | null) {
  const target = document.getElementById(elementId)
  const scrollRoot = content?.closest<HTMLElement>('.workspace-page')

  if (!target) {
    return
  }

  if (!scrollRoot) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    return
  }

  const rootTop = scrollRoot.getBoundingClientRect().top
  const targetTop = target.getBoundingClientRect().top
  const offset = 16

  scrollRoot.scrollTo({
    top: scrollRoot.scrollTop + targetTop - rootTop - offset,
    behavior: 'smooth',
  })
}

function getNoteDomId(noteId: string) {
  return `note-${noteId}`
}

interface NoteBlockProps {
  title: string
  content: string
}

function NoteBlock({ title, content }: NoteBlockProps) {
  return (
    <div className="note-block">
      <Text strong>{title}</Text>
      <Paragraph type="secondary">{content}</Paragraph>
    </div>
  )
}

interface NoteListProps {
  title: string
  items: string[]
}

function NoteList({ title, items }: NoteListProps) {
  return <DocList items={items} title={title} />
}

interface DocSectionProps {
  children: ReactNode
  title: string
}

function DocSection({ children, title }: DocSectionProps) {
  return (
    <section className="doc-section">
      <Text strong>{title}</Text>
      {children}
    </section>
  )
}

interface DocListProps {
  title: string
  items: string[]
}

function DocList({ title, items }: DocListProps) {
  return (
    <div className="note-list-block">
      <Text strong>{title}</Text>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Text type="secondary">{item}</Text>
          </li>
        ))}
      </ul>
    </div>
  )
}

function getMethodColor(method: ApiEndpointDoc['method']) {
  const colorMap: Record<ApiEndpointDoc['method'], string> = {
    DELETE: 'red',
    GET: 'green',
    PATCH: 'gold',
    POST: 'blue',
  }

  return colorMap[method]
}

export default NotesPage
