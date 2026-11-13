import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Layout, Space, Typography, message } from 'antd'
import {
  Archive,
  Bell,
  BookOpen,
  Container,
  FileText,
  Home,
  LayoutTemplate,
  LogOut,
  Plus,
  User,
} from 'lucide-react'
import { type PropsWithChildren, useEffect } from 'react'

import EditorPage from './pages/EditorPage'
import DeploymentPage from './pages/DeploymentPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MessagesPage from './pages/MessagesPage'
import MyTemplatesPage from './pages/MyTemplatesPage'
import NotesPage from './pages/NotesPage'
import RecycleBinPage from './pages/RecycleBinPage'
import TemplateDetailPage from './pages/TemplateDetailPage'
import WorkStatsPage from './pages/WorkStatsPage'
import WorksPage from './pages/WorksPage'
import {
  logout as logoutAuth,
  useCurrentUserQuery,
} from './api/auth'
import { getAuthToken } from './api/authStorage'
import { getRequestErrorMessage } from './api/error'
import { useMessagesQuery } from './api/messages'
import './App.css'

const { Header } = Layout
const { Text, Title } = Typography
const adminFeBaseUrl =
  import.meta.env.VITE_ADMIN_FE_BASE_URL?.replace(/\/$/, '') ??
  'http://127.0.0.1:7004'

const navItems = [
  { path: '/', label: '首页', icon: Home, end: true },
  { path: '/works', label: '我的作品', icon: FileText },
  { path: '/my-templates', label: '我的模板', icon: LayoutTemplate },
  { path: '/recycle-bin', label: '回收站', icon: Archive },
  { path: '/messages', label: '消息中心', icon: Bell },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data
  const messagesQuery = useMessagesQuery({ enabled: Boolean(currentUser) })
  const unreadMessageCount = messagesQuery.data?.unreadCount ?? 0
  const isHomePage = location.pathname === '/'

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
    <Layout className={`app-shell${isHomePage ? ' is-home-shell' : ''}`}>
      {!isHomePage ? (
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
            {navItems.map(({ end, path, label, icon: Icon }) => (
              <NavLink
                className="app-nav-link"
                end={Boolean(end)}
                key={path}
                to={path}
              >
                <Icon size={16} />
                {path === '/messages' ? (
                  <Badge
                    className="app-nav-badge"
                    count={unreadMessageCount}
                    overflowCount={99}
                    size="small"
                  >
                    <span>{label}</span>
                  </Badge>
                ) : (
                  <span>{label}</span>
                )}
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
            <Button icon={<BookOpen size={15} />} onClick={() => navigate('/notes')}>
              开发记录
            </Button>
            <Button icon={<Container size={15} />} onClick={() => navigate('/deployment')}>
              部署细节
            </Button>
            <Button icon={<Plus size={15} />} type="primary" onClick={() => navigate('/editor')}>
              新建作品
            </Button>
          </Space>
        </Header>
      ) : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
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
        <Route path="/deployment" element={<DeploymentPage />} />
        <Route
          path="/works"
          element={
            <ProtectedRoute>
              <WorksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-templates"
          element={
            <ProtectedRoute>
              <MyTemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recycle-bin"
          element={
            <ProtectedRoute>
              <RecycleBinPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/works/:workId/stats"
          element={
            <ProtectedRoute>
              <WorkStatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/:templateId"
          element={<TemplateDetailPage />}
        />
        <Route
          path="/templates"
          element={<Navigate to="/" replace />}
        />
        <Route path="/admin/*" element={<AdminRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function AdminRedirect() {
  useEffect(() => {
    const targetUrl = new URL(`${adminFeBaseUrl}/login`)
    const token = getAuthToken()
    if (token) {
      targetUrl.searchParams.set('token', token)
      targetUrl.searchParams.set('redirect', '/admin/works')
    }
    window.location.replace(targetUrl.toString())
  }, [])

  return null
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
