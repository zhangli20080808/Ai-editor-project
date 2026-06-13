import { Navigate, NavLink, Route, Routes } from 'react-router'
import { Button, Layout, Space, Typography } from 'antd'
import { BookOpen, FileText, LayoutTemplate, PenTool } from 'lucide-react'

import EditorPage from './pages/EditorPage'
import NotesPage from './pages/NotesPage'
import TemplatesPage from './pages/TemplatesPage'
import WorksPage from './pages/WorksPage'
import './App.css'

const { Header } = Layout
const { Text, Title } = Typography

const navItems = [
  { path: '/editor', label: '编辑器', icon: PenTool },
  { path: '/notes', label: '开发记录', icon: BookOpen },
  { path: '/works', label: '作品', icon: FileText },
  { path: '/templates', label: '模板', icon: LayoutTemplate },
]

function App() {
  return (
    <Layout className="app-shell">
      <Header className="app-header">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div>
            <Title level={4} className="app-title">
              Ai Editor
            </Title>
            <Text type="secondary" className="brand-subtitle">
              H5 营销作品搭建平台
            </Text>
          </div>
        </div>
        <nav className="app-nav" aria-label="主导航">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink className="app-nav-link" key={path} to={path}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <Space size={8} className="header-actions">
          <Button>预览</Button>
          <Button>保存</Button>
          <Button type="primary">创建作品</Button>
        </Space>
      </Header>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/works" element={<WorksPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="*" element={<Navigate to="/editor" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
