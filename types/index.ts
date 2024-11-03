export interface DockerContainer {
  ID: string;
  Names: string;
  Image: string;
  Command: string;
  CreatedAt: string;
  Status: string;
  State: string;
  Ports: string;
  Labels: string;
  Size: string;
  Networks: string;
  RunningFor: string;
  LocalVolumes: string;
  Mounts: string;
}

export interface DockerContainerInspect {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    OOMKilled: boolean;
    Dead: boolean;
    Pid: number;
    ExitCode: number;
    Error: string;
    StartedAt: string;
    FinishedAt: string;
  };
  Config: {
    Hostname: string;
    Env: string[];
    Cmd: string[];
    Image: string;
    Labels: { [key: string]: string };
  };
  NetworkSettings: {
    Ports: { [key: string]: Array<{ HostIp: string; HostPort: string }> };
    Networks: { [key: string]: { IPAddress: string; Gateway: string } };
  };
}

export interface Device {
  _id?: string;
  name: string;
  type: string;
  hostname: string;
  port: number;
  username: string;
  status?: 'online' | 'offline';
  lastSeen?: Date;
}

export interface ExecutionResult {
  results: Array<{
    deviceId: string;
    success: boolean;
    output?: string;
    error?: string;
  }>;
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  permissions?: string;
  owner?: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  service?: string;
  metadata?: Record<string, unknown>;
}

export interface SSHConnection {
  _id?: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  identityFile?: string;
  status?: 'connected' | 'disconnected' | 'error';
  createdAt?: Date;
  lastConnected?: Date;
  importedFrom?: 'ssh_config' | 'manual' | 'import';
  forwardAgent?: boolean;
  proxyCommand?: string;
  sshOptions?: {
    compression?: string;
    connectTimeout?: string;
    strictHostKeyChecking?: string;
    userKnownHostsFile?: string;
  };
  lastTest?: {
    success: boolean;
    timestamp: Date;
    error?: string;
    details?: {
      client?: string;
      serverVersion?: string;
      [key: string]: any;
    };
  };
}

export interface TerminalSession {
  id: string;
  connectionId: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'closed';
}

export interface CommandResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}

export type ContainerAction = 'start' | 'stop' | 'restart' | 'remove';

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImportResult {
  success: boolean;
  imported?: Array<{
    success: boolean;
    name: string;
    _id?: string;
    error?: string;
    testResult?: SSHConnection['lastTest'];
  }>;
  error?: string;
}
