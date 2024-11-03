'use client'

import DockerManagement from '@/components/DockerManagement'
import type { DockerContainer } from '@/types'

export default function DockerPage() {
  const fetchContainers = async (): Promise<DockerContainer[]> => {
    const response = await fetch('/api/docker-containers')
    if (!response.ok) {
      throw new Error('Failed to fetch containers')
    }
    return response.json()
  }

  const performContainerAction = async (id: string, action: 'start' | 'stop' | 'remove'): Promise<void> => {
    const response = await fetch(`/api/docker-containers/${id}/${action}`, {
      method: 'POST'
    })
    if (!response.ok) {
      throw new Error(`Failed to ${action} container`)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Docker Management</h1>
      <DockerManagement
        fetchContainers={fetchContainers}
        performContainerAction={performContainerAction}
      />
    </div>
  )
}
