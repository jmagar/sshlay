'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Container, Typography, CircularProgress } from '@mui/material'
import SSHConnectionForm from '@/components/SSHConnectionForm'
import DockerManagement from '@/components/DockerManagement'
import Terminal from '@/components/terminal'
import Logs from '@/components/logs'
import type { SSHConnection } from '@/types'

export default function DynamicPage() {
  const router = useRouter()
  const [pageType, setPageType] = useState<'ssh' | 'docker' | null>(null)

  useEffect(() => {
    // Determine the page type based on the id
    // This is a placeholder logic, adjust according to your routing strategy
    setPageType('ssh')
  }, []);

  if (!pageType) {
    return <CircularProgress />
  }

  const handleSSHSubmit = async (connection: SSHConnection) => {
    try {
      const response = await fetch('/api/ssh-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(connection),
      })
      if (!response.ok) throw new Error('Failed to create SSH connection')
    } catch (error) {
      console.error('Error creating SSH connection:', error)
    }
  }

  const fetchContainers = async () => {
    const response = await fetch('/api/docker-containers')
    if (!response.ok) throw new Error('Failed to fetch containers')
    return response.json()
  }

  const performContainerAction = async (id: string, action: 'start' | 'stop' | 'remove') => {
    const response = await fetch(`/api/docker-containers/${id}/${action}`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error(`Failed to ${action} container`)
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {pageType === 'ssh' ? 'SSH Connection' : 'Docker Management'}
      </Typography>
      {pageType === 'ssh' ? (
        <>
          <SSHConnectionForm onSubmit={handleSSHSubmit} />
          <Terminal />
          <Logs />
        </>
      ) : (
        <DockerManagement
          fetchContainers={fetchContainers}
          performContainerAction={performContainerAction}
        />
      )}
    </Container>
  )
}
