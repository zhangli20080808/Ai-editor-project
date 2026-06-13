import { useNavigate, useSearchParams } from 'react-router'
import { Button, Card, Form, Input, Space, Typography, message } from 'antd'
import { LogIn } from 'lucide-react'

import {
  useLoginByPhoneMutation,
  useSendLoginCodeMutation,
} from '../api/auth'
import { getRequestErrorMessage } from '../api/error'

const { Paragraph, Text, Title } = Typography
const defaultLoginValues = {
  phoneNumber: '13800138000',
  code: '123456',
}

interface LoginFormValues {
  phoneNumber: string
  code: string
}

function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loginForm] = Form.useForm<LoginFormValues>()
  const sendLoginCodeMutation = useSendLoginCodeMutation()
  const loginByPhoneMutation = useLoginByPhoneMutation()
  const redirect = searchParams.get('redirect') || '/editor'

  const handleSendCode = async () => {
    try {
      const values = await loginForm.validateFields(['phoneNumber'])
      const result = await sendLoginCodeMutation.mutateAsync(values.phoneNumber)
      loginForm.setFieldValue('code', result.mockCode)
      message.success(`验证码已生成：${result.mockCode}`)
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  const handleLogin = async () => {
    try {
      const values = await loginForm.validateFields()
      await loginByPhoneMutation.mutateAsync(values)
      message.success('登录成功')
      navigate(redirect, { replace: true })
    } catch (error) {
      message.error(getRequestErrorMessage(error))
    }
  }

  return (
    <main className="login-page">
      <Card className="login-card">
        <div className="login-card-header">
          <div className="login-icon">
            <LogIn size={22} />
          </div>
          <Title level={3}>登录 Ai Editor</Title>
          <Paragraph type="secondary">
            当前使用本地 mock 短信验证码，方便开发阶段快速进入工作台。
          </Paragraph>
        </div>
        <Form
          form={loginForm}
          initialValues={defaultLoginValues}
          layout="vertical"
          className="login-form"
          onFinish={handleLogin}
        >
          <Form.Item
            label="手机号"
            name="phoneNumber"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input size="large" placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="验证码" required>
            <Space.Compact className="full-control">
              <Form.Item
                name="code"
                noStyle
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <Input size="large" placeholder="本地 mock 验证码" />
              </Form.Item>
              <Button
                size="large"
                loading={sendLoginCodeMutation.isPending}
                onClick={handleSendCode}
              >
                获取验证码
              </Button>
            </Space.Compact>
          </Form.Item>
          <Button
            block
            size="large"
            type="primary"
            htmlType="submit"
            loading={loginByPhoneMutation.isPending}
          >
            登录
          </Button>
        </Form>
        <Text type="secondary" className="login-hint">
          默认手机号 13800138000，默认验证码 123456。
        </Text>
      </Card>
    </main>
  )
}

export default LoginPage
