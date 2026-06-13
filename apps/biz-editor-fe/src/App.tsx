import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Layout, Space, Typography, message } from 'antd'
import { BookOpen, FileText, LayoutTemplate, LogOut, PenTool, User } from 'lucide-react'
import { type PropsWithChildren, useEffect } from 'react'

import EditorPage from './pages/EditorPage'
import LoginPage from './pages/LoginPage'
import NotesPage from './pages/NotesPage'
import TemplatesPage from './pages/TemplatesPage'
import WorksPage from './pages/WorksPage'
import {
  logout as logoutAuth,
  useCurrentUserQuery,
} from './api/auth'
import { getAuthToken } from './api/authStorage'
import { getRequestErrorMessage } from './api/error'
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
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data

  useEffect(() => {
    if (currentUserQuery.error) {
      logoutAuth(queryClient)
      message.warning(getRequestErrorMessage(currentUserQuery.error))
    }
  }, [currentUserQuery.error, queryClient])

  const handleLogout = () => {
    logoutAuth(queryClient)
    window.location.reload()
  }

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
          {currentUser ? (
            <Space size={8} className="header-user">
              <User size={15} />
              <span>{currentUser.nickName || currentUser.username}</span>
              <Button
                icon={<LogOut size={14} />}
                size="small"
                onClick={handleLogout}
              >
                退出
              </Button>
            </Space>
          ) : (
            <Button onClick={() => navigate('/login')}>登录</Button>
          )}
          <Button type="primary" onClick={() => navigate('/editor')}>
            创建作品
          </Button>
        </Space>
      </Header>
      <Routes>
        <Route path="/" element={<Navigate to="/notes" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:workId"
          element={
            <ProtectedRoute>
              <EditorPage />
            </ProtectedRoute>
          }
        />
        <Route path="/notes" element={<NotesPage />} />
        <Route
          path="/works"
          element={
            <ProtectedRoute>
              <WorksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </Layout>
  )
}

function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()

  if (!getAuthToken()) {
    const redirect = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    )
  }

  return children
}

export default App
