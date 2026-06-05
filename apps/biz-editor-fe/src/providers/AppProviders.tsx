import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import type { PropsWithChildren } from 'react'
import { useState } from 'react'

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#ff5a3c',
            borderRadius: 4,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  )
}
