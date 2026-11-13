import { useQueryClient } from '@tanstack/react-query'
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router'
import { Button, Layout, Space, Spin, Typography, message } from 'antd'
import {
  ClipboardList,
  FileText,
  LogOut,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { type PropsWithChildren, useEffect } from 'react'

import { logout, useCurrentUserQuery } from './api/auth'
import { getAuthToken } from './api/authStorage'
import { getRequestErrorMessage } from './api/error'
import AuditLogsPage from './pages/AuditLogsPage'
import LoginPage from './pages/LoginPage'
import TemplatesPage from './pages/TemplatesPage'
import UsersPage from './pages/UsersPage'
import WorksPage from './pages/WorksPage'

const { Content, Header, Sider } = Layout
const { Text, Title } = Typography

const navItems = [
  { path: '/admin/works', label: '作品治理', icon: FileText },
  { path: '/admin/templates', label: '模板治理', icon: Sparkles },
  { path: '/admin/users', label: '用户治理', icon: Users },
  { path: '/admin/audit-logs', label: '审计日志', icon: ClipboardList },
]

function App() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <ProtectedAdminRoute>
      <AdminShell />
    </ProtectedAdminRoute>
  )
}

function AdminShell() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data

  const handleLogout = () => {
    logout(queryClient)
    navigate('/login', { replace: true })
  }

  return (
    <Layout className="admin-shell">
      <Sider className="admin-sider" width={248}>
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <ShieldCheck size={24} />
          </div>
          <div>
            <Title level={4}>Ai Admin</Title>
            <Text>平台治理控制台</Text>
          </div>
        </div>
        <nav className="admin-nav" aria-label="后台导航">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink className="admin-nav-link" key={path} to={path}>
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </Sider>
      <Layout>
        <Header className="admin-header">
          <div>
            <Text className="admin-kicker">治理台</Text>
            <Title level={3}>内容、账号与操作追溯</Title>
          </div>
          <Space size={12}>
            <Text>{currentUser?.nickName || currentUser?.username}</Text>
            <Button icon={<LogOut size={14} />} onClick={handleLogout}>
              退出
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/works" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/works" replace />} />
            <Route path="/admin/works" element={<WorksPage />} />
            <Route path="/admin/templates" element={<TemplatesPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/admin/works" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUserQuery = useCurrentUserQuery()

  useEffect(() => {
    if (currentUserQuery.error) {
      message.error(getRequestErrorMessage(currentUserQuery.error))
      logout(queryClient)
      navigate('/login', { replace: true })
    }
  }, [currentUserQuery.error, navigate, queryClient])

  if (!getAuthToken()) {
    const redirect = `${location.pathname}${location.search}`
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    )
  }

  if (currentUserQuery.isPending) {
    return (
      <div className="center-screen">
        <Spin tip="正在校验后台权限" />
      </div>
    )
  }

  if (currentUserQuery.data?.role !== 'admin') {
    logout(queryClient)
    return <Navigate to="/login?reason=forbidden" replace />
  }

  return children
}

export default App
