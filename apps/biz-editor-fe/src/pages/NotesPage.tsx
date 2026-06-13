import { Card, Empty, Space, Tabs, Tag, Timeline, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  learningNoteCategories,
  learningNotes,
  type LearningNote,
} from '../data/learningNotes'

const { Paragraph, Text, Title } = Typography

function NotesPage() {
  const tabItems = [
    {
      key: 'all',
      label: '全部',
      children: <NotesTimeline notes={learningNotes} />,
    },
    ...learningNoteCategories.map((category) => ({
      key: category,
      label: category,
      children: (
        <NotesTimeline
          notes={learningNotes.filter((note) => note.category === category)}
        />
      ),
    })),
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
          <Text strong>{learningNotes.length}</Text>
          <Text type="secondary">条记录</Text>
        </div>
      </section>
      <Card className="workspace-panel">
        <Tabs items={tabItems} />
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
            children: (
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

function scrollToNote(noteId: string, content: HTMLElement | null) {
  const target = document.getElementById(getNoteDomId(noteId))
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

export default NotesPage
