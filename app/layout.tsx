import * as React from 'react'
import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'SSHlay',
  description: 'SSH and Docker Management Interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
