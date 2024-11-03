'use client'

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as TestIcon
} from '@mui/icons-material';
import type { SSHConnection, APIResponse } from '@/types';

export default function SSHConnectionManager() {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SSHConnection>>({
    name: '',
    hostname: '',
    port: 22,
    username: ''
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ssh-connections');
      if (!response.ok) throw new Error('Failed to fetch SSH connections');
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError('Failed to fetch SSH connections');
      console.error('Error fetching connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const method = editingConnection ? 'PUT' : 'POST';
      const url = editingConnection
        ? `/api/ssh-connections/${editingConnection._id}`
        : '/api/ssh-connections';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save connection');
      }

      await fetchConnections();
      setOpenDialog(false);
      setEditingConnection(null);
      setFormData({
        name: '',
        hostname: '',
        port: 22,
        username: ''
      });
    } catch (err) {
      setError('Failed to save connection');
      console.error('Error saving connection:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ssh-connections/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete connection');
      }

      await fetchConnections();
    } catch (err) {
      setError('Failed to delete connection');
      console.error('Error deleting connection:', err);
    }
  };

  const handleTest = async (connection: SSHConnection) => {
    if (!connection._id) return;

    setTestingConnection(connection._id);
    try {
      const response = await fetch(`/api/ssh-connections/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: connection.hostname,
          port: connection.port,
          username: connection.username
        })
      });

      if (!response.ok) {
        throw new Error('Connection test failed');
      }

      const result: APIResponse = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Connection test failed');
      }
    } catch (err) {
      setError(`Failed to test connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleEdit = (connection: SSHConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      hostname: connection.hostname,
      port: connection.port,
      username: connection.username
    });
    setOpenDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 22 : value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5" component="div">
            SSH Connections
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingConnection(null);
              setFormData({
                name: '',
                hostname: '',
                port: 22,
                username: ''
              });
              setOpenDialog(true);
            }}
          >
            Add New Connection
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection._id}>
                  <TableCell>{connection.name}</TableCell>
                  <TableCell>{connection.hostname}</TableCell>
                  <TableCell>{connection.port}</TableCell>
                  <TableCell>{connection.username}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      connection.status === 'connected'
                        ? 'bg-green-100 text-green-800'
                        : connection.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {connection.status || 'disconnected'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(connection)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(connection._id!)}
                      disabled={connection.status === 'connected'}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleTest(connection)}
                      disabled={testingConnection === connection._id}
                    >
                      {testingConnection === connection._id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <TestIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingConnection ? 'Edit Connection' : 'Add New Connection'}
          </DialogTitle>
          <DialogContent>
            <div className="space-y-4 mt-4">
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Hostname"
                name="hostname"
                value={formData.hostname}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Port"
                name="port"
                type="number"
                value={formData.port}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.name || !formData.hostname || !formData.username}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
