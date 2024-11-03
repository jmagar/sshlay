export interface Device {
  id: string;
  name: string;
  type: 'ssh' | 'docker';
}

export interface ExecutionResult {
  output: string;
}

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
}

export interface SSHConnection {
  name: string;
  hostname: string;
  port: string;
  username: string;
  authMethod: 'password' | 'key';
  password: string;
  privateKey: string;
}