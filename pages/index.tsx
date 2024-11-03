import React from 'react';
import { Container, Grid, Typography } from '@mui/material';
import RemoteCodeExecution from '../components/RemoteCodeExecution';
import SSHConnectionForm from '../components/SSHConnectionForm';
import DockerManagement from '../components/DockerManagement';
import SocketSetup from '../components/SocketSetup';
import { ExecutionResult, Device, SSHConnection, DockerContainer } from '../types';

const Home: React.FC = () => {
  const handleCodeExecution = async (code: string, devices: string[]): Promise<ExecutionResult> => {
    // Implement API call for code execution
    console.log('Executing code:', code, 'on devices:', devices);
    return { output: 'Code execution result' };
  };

  const fetchDevices = async (): Promise<Device[]> => {
    // Implement API call to fetch devices
    return [
      { id: '1', name: 'Device 1', type: 'ssh' },
      { id: '2', name: 'Device 2', type: 'docker' },
    ];
  };

  const handleSSHConnectionSubmit = async (connection: SSHConnection): Promise<void> => {
    // Implement API call to add SSH connection
    console.log('Adding SSH connection:', connection);
  };

  const fetchContainers = async (): Promise<DockerContainer[]> => {
    // Implement API call to fetch Docker containers
    return [
      { id: '1', name: 'Container 1', image: 'image1', status: 'running', ports: '8080:80' },
      { id: '2', name: 'Container 2', image: 'image2', status: 'stopped', ports: '3000:3000' },
    ];
  };

  const performContainerAction = async (id: string, action: 'start' | 'stop' | 'remove'): Promise<void> => {
    // Implement API call to perform container action
    console.log('Performing action:', action, 'on container:', id);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Remote Management System
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <RemoteCodeExecution onExecute={handleCodeExecution} fetchDevices={fetchDevices} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SSHConnectionForm onSubmit={handleSSHConnectionSubmit} />
        </Grid>
        <Grid item xs={12}>
          <DockerManagement fetchContainers={fetchContainers} performContainerAction={performContainerAction} />
        </Grid>
        <Grid item xs={12}>
          <SocketSetup />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;