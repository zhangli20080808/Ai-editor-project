import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  title: 'Ai Editor H5',
  description: 'Published H5 page rendered by Ai Editor.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="h5-shell">{children}</div>
      </body>
    </html>
  )
}
