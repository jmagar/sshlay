import { Device, ExecutionResult, SSHConnection, DockerContainer } from '../types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const executeCode = async (code: string, devices: string[]): Promise<ExecutionResult> => {
  const response = await fetch(`${API_BASE_URL}/api/execute-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, devices }),
  })
  if (!response.ok) throw new Error('Failed to execute code')
  return response.json()
}

export const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch(`${API_BASE_URL}/api/devices`)
  if (!response.ok) throw new Error('Failed to fetch devices')
  return response.json()
}

export const addDevice = async (device: Omit<Device, 'id'>): Promise<Device> => {
  const response = await fetch(`${API_BASE_URL}/api/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device),
  })
  if (!response.ok) throw new Error('Failed to add device')
  return response.json()
}

export const addSSHConnection = async (connection: SSHConnection): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/ssh-connections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connection),
  })
  if (!response.ok) throw new Error('Failed to add SSH connection')
}

export const fetchContainers = async (): Promise<DockerContainer[]> => {
  const response = await fetch(`${API_BASE_URL}/api/docker-containers`)
  if (!response.ok) throw new Error('Failed to fetch containers')
  return response.json()
}

export const performContainerAction = async (id: string, action: 'start' | 'stop' | 'remove'): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/docker-containers/${id}/${action}`, { method: 'POST' })
  if (!response.ok) throw new Error(`Failed to ${action} container`)
}