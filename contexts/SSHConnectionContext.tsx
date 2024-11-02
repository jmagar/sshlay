"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

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
}

const SSHConnectionContext = createContext<SSHConnectionContextType | undefined>(undefined)

export function SSHConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<SSHConnection[]>([])

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/ssh-connections")
      if (!response.ok) throw new Error("Failed to fetch SSH connections")
      const data = await response.json()
      setConnections(data)
    } catch (err) {
      console.error("Error fetching SSH connections:", err)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [])

  return (
    <SSHConnectionContext.Provider value={{ connections, setConnections, fetchConnections }}>
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
