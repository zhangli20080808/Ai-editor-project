import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'

import {
  authKeys,
  getCurrentUser,
  useLoginByPhoneMutation,
  useSendLoginCodeMutation,
} from '../api/auth'
import { clearAuthToken, setAuthToken } from '../api/authStorage'
import { getRequestErrorMessage } from '../api/error'

const { Paragraph, Text, Title } = Typography

interface LoginFormValues {
  phoneNumber: string
  code: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const sendCodeMutation = useSendLoginCodeMutation()
  const loginMutation = useLoginByPhoneMutation()

  const redirect = searchParams.get('redirect') || '/admin/works'
  const tokenFromBiz = searchParams.get('token')
  const isForbidden = searchParams.get('reason') === 'forbidden'

  useEffect(() => {
    if (!tokenFromBiz) return

    const loginWithSharedToken = async () => {
      setAuthToken(tokenFromBiz)
      try {
        const user = await getCurrentUser()
        if (user.role !== 'admin') {
          clearAuthToken()
          queryClient.removeQueries({ queryKey: authKeys.me })
          message.error('当前账号没有后台访问权限')
          return
        }

        queryClient.setQueryData(authKeys.me, user)
        navigate(redirect, { replace: true })
      } catch (error) {
        clearAuthToken()
        message.error(getRequestErrorMessage(error))
      }
    }

    void loginWithSharedToken()
  }, [navigate, queryClient, redirect, tokenFromBiz])

  const handleSendCode = async (phoneNumber?: string) => {
    if (!phoneNumber) {
      message.warning('请先输入手机号')
      return
    }

    try {
      const result = await sendCodeMutation.mutateAsync(phoneNumber)
      message.success(`验证码：${result.mockCode}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const result = await loginMutation.mutateAsync(values)
      if (result.user.role !== 'admin') {
        clearAuthToken()
        queryClient.removeQueries({ queryKey: authKeys.me })
        message.error('当前账号没有后台访问权限')
        return
      }

      navigate(redirect, { replace: true })
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="login-logo">
          <ShieldCheck size={34} />
        </div>
        <Title>Ai Editor Admin</Title>
        <Paragraph>
          管理作品发布状态、账号风险和治理审计记录。
        </Paragraph>
      </section>
      <Card className="login-card">
        <Space direction="vertical" size={4}>
          <Text className="admin-kicker">管理员登录</Text>
          <Title level={3}>进入治理控制台</Title>
          {isForbidden ? (
            <Text type="danger">当前账号不是管理员或已被冻结。</Text>
          ) : null}
        </Space>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="手机号"
            name="phoneNumber"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="输入管理员手机号" size="large" />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => (
              <Form.Item
                label="验证码"
                name="code"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input.Search
                  enterButton="发送验证码"
                  loading={sendCodeMutation.isPending}
                  onSearch={() => handleSendCode(getFieldValue('phoneNumber'))}
                  placeholder="本地环境会返回 mockCode"
                  size="large"
                />
              </Form.Item>
            )}
          </Form.Item>
          <Button
            block
            htmlType="submit"
            loading={loginMutation.isPending}
            size="large"
            type="primary"
          >
            登录后台
          </Button>
        </Form>
      </Card>
    </main>
  )
}
