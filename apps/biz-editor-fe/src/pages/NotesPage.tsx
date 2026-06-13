import { Card, Empty, Space, Tabs, Tag, Timeline, Typography } from 'antd'
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
  if (notes.length === 0) {
    return <Empty description="暂无记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return (
    <Timeline
      className="notes-timeline"
      items={notes.map((note) => ({
        color: '#ff5a3c',
        children: (
          <article className="note-entry">
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
  )
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
