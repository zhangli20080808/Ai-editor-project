import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: '#1d4ed8',
            borderRadius: 6,
            fontFamily:
              'Avenir Next, "PingFang SC", "Microsoft YaHei", sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  )
}
