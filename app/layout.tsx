import * as React from 'react'
import './globals.css'
import { Providers } from './providers'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Metadata for the application
 * Used by Next.js for SEO and document head management
 */
export const metadata = {
  title: 'SSHlay',
  description: 'SSH and Docker Management Interface',
}

/**
 * Root Layout Component
 *
 * This is the top-level layout component for the entire application.
 * It wraps all pages with:
 * - Providers (Theme, Context providers)
 * - ErrorBoundary for global error handling
 * - Basic HTML structure
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components (pages) to be rendered
 */
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
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
