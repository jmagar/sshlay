"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"

interface SSHConnection {
  id: string
  name: string
  hostname: string
  port: string
  username: string
  authMethod: "password" | "key"
}

interface SSHConnectionContextType {
  connections: SSHConnection[]
  setConnections: React.Dispatch<React.SetStateAction<SSHConnection[]>>
  fetchConnections: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

const SSHConnectionContext = createContext<SSHConnectionContextType | undefined>(undefined)

export function SSHConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/ssh-connections", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setConnections(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch SSH connections')
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error fetching SSH connections:", error)
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchConnections()

    // Optional: Set up polling for real-time updates
    const pollInterval = 30000 // 30 seconds
    const intervalId = setInterval(fetchConnections, pollInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchConnections])

  const value = React.useMemo(() => ({
    connections,
    setConnections,
    fetchConnections,
    isLoading,
    error
  }), [connections, fetchConnections, isLoading, error])

  return (
    <SSHConnectionContext.Provider value={value}>
      {children}
    </SSHConnectionContext.Provider>
  )
}

export function useSSHConnections() {
  const context = useContext(SSHConnectionContext)
  if (context === undefined) {
    throw new Error('useSSHConnections must be used within a SSHConnectionProvider')
  }
  return context
}
