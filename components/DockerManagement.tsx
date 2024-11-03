import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Box
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { DockerContainer } from '../types';

interface DockerManagementProps {
  fetchContainers: () => Promise<DockerContainer[]>;
  performContainerAction: (id: string, action: 'start' | 'stop' | 'remove') => Promise<void>;
}

const DockerManagement: React.FC<DockerManagementProps> = ({ fetchContainers, performContainerAction }) => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchContainers();
      setContainers(data);
    } catch (err) {
      setError('Failed to fetch containers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'remove') => {
    try {
      await performContainerAction(id, action);
      await loadContainers(); // Refresh the container list
    } catch (err) {
      setError(`Failed to ${action} container. Please try again.`);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Docker Containers</Typography>
        {error && <Typography color="error">{error}</Typography>}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Image</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ports</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {containers.map((container) => (
                <TableRow key={container.id}>
                  <TableCell>{container.name}</TableCell>
                  <TableCell>{container.image}</TableCell>
                  <TableCell>{container.status}</TableCell>
                  <TableCell>{container.ports}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleContainerAction(container.id, 'start')} disabled={container.status === 'running'}>
                      <StartIcon />
                    </IconButton>
                    <IconButton onClick={() => handleContainerAction(container.id, 'stop')} disabled={container.status !== 'running'}>
                      <StopIcon />
                    </IconButton>
                    <IconButton onClick={() => handleContainerAction(container.id, 'remove')}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box mt={2}>
          <Button onClick={loadContainers} variant="contained" color="primary">
            Refresh Containers
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DockerManagement;