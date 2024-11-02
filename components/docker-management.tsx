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
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string;
}

export default function DockerManagement() {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/docker/containers');
      if (!response.ok) throw new Error('Failed to fetch containers');
      const data = await response.json();
      setContainers(data);
    } catch (err) {
      setError('Failed to fetch containers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'remove') => {
    // Implementation for container actions
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Docker Containers
        </Typography>
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
                    <IconButton
                      onClick={() => handleContainerAction(container.id, 'start')}
                      disabled={container.status === 'running'}
                    >
                      <StartIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleContainerAction(container.id, 'stop')}
                      disabled={container.status !== 'running'}
                    >
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
      </CardContent>
    </Card>
  );
}