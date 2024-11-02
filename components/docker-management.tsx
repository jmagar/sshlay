import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { PlayArrow, Stop, Delete, Add } from '@mui/icons-material';

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
  const [openDialog, setOpenDialog] = useState(false);
  const [newContainer, setNewContainer] = useState({ image: '', name: '' });

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
    try {
      const response = await fetch(`/api/docker/containers/${id}/${action}`, { method: 'POST' });
      if (!response.ok) throw new Error(`Failed to ${action} container`);
      fetchContainers();
    } catch (err) {
      setError(`Failed to ${action} container`);
    }
  };

  const handleCreateContainer = async () => {
    try {
      const response = await fetch('/api/docker/containers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContainer),
      });
      if (!response.ok) throw new Error('Failed to create container');
      fetchContainers();
      setOpenDialog(false);
      setNewContainer({ image: '', name: '' });
    } catch (err) {
      setError('Failed to create container');
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Docker Containers
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Create Container
      </Button>
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
                  <Button
                    startIcon={<PlayArrow />}
                    onClick={() => handleContainerAction(container.id, 'start')}

                    disabled={container.status === 'running'}
                  >
                    Start
                  </Button>
                  <Button
                    startIcon={<Stop />}
                    onClick={() => handleContainerAction(container.id, 'stop')}
                    disabled={container.status !== 'running'}
                  >
                    Stop
                  </Button>
                  <Button
                    startIcon={<Delete />}
                    onClick={() => handleContainerAction(container.id, 'remove')}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Container</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Image"
            fullWidth
            value={newContainer.image}
            onChange={(e) => setNewContainer({ ...newContainer, image: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={newContainer.name}
            onChange={(e) => setNewContainer({ ...newContainer, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateContainer}>Create</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}