'use client'

import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  Tooltip,
  Box,
  Stack,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as TestIcon,
  Upload as UploadIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import type { SSHConnection, APIResponse } from '@/types';

/**
 * SSH Connection Manager Component
 *
 * Manages SSH connections including:
 * - Listing existing connections
 * - Adding/Editing/Deleting connections
 * - Testing connections
 * - Importing connections from SSH config files
 *
 * Features:
 * - Real-time connection status
 * - Connection testing with detailed feedback
 * - Bulk import from ~/.ssh/config
 * - File upload for SSH config import
 * - Password and private key authentication support
 */
export default function SSHConnectionManager() {
  // State management for connections and UI
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form data for connection creation/editing
  const [formData, setFormData] = useState<Partial<SSHConnection>>({
    name: '',
    hostname: '',
    port: 22,
    username: ''
  });

  // Fetch connections on component mount
  useEffect(() => {
    fetchConnections();
  }, []);

  /**
   * Fetches all SSH connections from the backend
   * Updates the connections state and handles loading/error states
   */
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

  /**
   * Handles saving a new or edited SSH connection
   * Validates required fields and updates the backend
   */
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

  /**
   * Handles deleting an SSH connection
   * @param {string} id - The ID of the connection to delete
   */
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

  /**
   * Tests an SSH connection by attempting to connect
   * @param {SSHConnection} connection - The connection to test
   */
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
          username: connection.username,
          password: connection.password,
          privateKey: connection.privateKey
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

  /**
   * Opens the edit dialog for a connection
   * @param {SSHConnection} connection - The connection to edit
   */
  const handleEdit = (connection: SSHConnection) => {
    setEditingConnection(connection);
    setFormData({
      name: connection.name,
      hostname: connection.hostname,
      port: connection.port,
      username: connection.username,
      password: connection.password,
      privateKey: connection.privateKey
    });
    setOpenDialog(true);
  };

  /**
   * Handles form input changes
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value, 10) || 22 : value
    }));
  };

  /**
   * Handles importing SSH config from an uploaded file
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event
   */
  const handleConfigUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('config', file);

      const response = await fetch('/api/ssh-connections/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to import SSH config');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to import SSH config');
      }

      await fetchConnections();

      // Show success message with import details
      const imported = result.imported.filter((r: any) => r.success).length;
      const failed = result.imported.filter((r: any) => !r.success).length;
      setError(`Successfully imported ${imported} connections${failed > 0 ? `, ${failed} failed` : ''}`);
    } catch (err) {
      setError(`Failed to import SSH config: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  /**
   * Handles importing SSH config from the default ~/.ssh/config file
   */
  const handleImportFromDefault = async () => {
    setImportLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ssh-connections/import', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: '~/.ssh/config'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to import SSH config');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to import SSH config');
      }

      await fetchConnections();

      // Show success message with import details
      const imported = result.imported.filter((r: any) => r.success).length;
      const failed = result.imported.filter((r: any) => !r.success).length;
      setError(`Successfully imported ${imported} connections${failed > 0 ? `, ${failed} failed` : ''}`);
    } catch (err) {
      setError(`Failed to import SSH config: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">SSH Connections</Typography>
          <Stack direction="row" spacing={1}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".conf,.config,text/*"
              style={{ display: 'none' }}
              onChange={handleConfigUpload}
            />
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
            >
              Upload Config
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleImportFromDefault}
              disabled={importLoading}
            >
              Import from ~/.ssh/config
            </Button>
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
          </Stack>
        </Box>

        {error && (
          <Alert
            severity={error.toLowerCase().includes('success') ? 'success' : 'error'}
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {importLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography>Importing SSH config...</Typography>
          </Box>
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
                <TableCell>Last Test</TableCell>
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
                    <Chip
                      label={connection.status || 'disconnected'}
                      color={
                        connection.status === 'connected' ? 'success' :
                        connection.status === 'error' ? 'error' :
                        'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {connection.lastTest && (
                      <Tooltip title={
                        connection.lastTest.error ||
                        (connection.lastTest.details && JSON.stringify(connection.lastTest.details, null, 2))
                      }>
                        <Chip
                          label={
                            <>
                              {connection.lastTest.success ? 'Success' : 'Failed'}
                              <Typography variant="caption" component="div">
                                {new Date(connection.lastTest.timestamp).toLocaleString()}
                              </Typography>
                            </>
                          }
                          color={connection.lastTest.success ? 'success' : 'error'}
                          size="small"
                        />
                      </Tooltip>
                    )}
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
            <Stack spacing={2} sx={{ mt: 2 }}>
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
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                helperText="Optional if using private key"
              />
              <TextField
                fullWidth
                label="Private Key"
                name="privateKey"
                multiline
                rows={4}
                value={formData.privateKey || ''}
                onChange={handleInputChange}
                helperText="Optional if using password"
              />
            </Stack>
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
