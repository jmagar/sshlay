import { Device, ExecutionResult, SSHConnection, DockerContainer } from '../types';

export const executeCode = async (code: string, devices: string[]): Promise<ExecutionResult> => {
  const response = await fetch('/api/execute-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, devices }),
  });
  if (!response.ok) throw new Error('Failed to execute code');
  return response.json();
};

export const fetchDevices = async (): Promise<Device[]> => {
  const response = await fetch('/api/devices');
  if (!response.ok) throw new Error('Failed to fetch devices');
  return response.json();
};

export const addSSHConnection = async (connection: SSHConnection): Promise<void> => {
  const response = await fetch('/api/ssh-connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(connection),
  });
  if (!response.ok) throw new Error('Failed to add SSH connection');
};

export const fetchContainers = async (): Promise<DockerContainer[]> => {
  const response = await fetch('/api/docker-containers');
  if (!response.ok) throw new Error('Failed to fetch containers');
  return response.json();
};

export const performContainerAction = async (id: string, action: 'start' | 'stop' | 'remove'): Promise<void> => {
  const response = await fetch(`/api/docker-containers/${id}/${action}`, { method: 'POST' });
  if (!response.ok) throw new Error(`Failed to ${action} container`);
};