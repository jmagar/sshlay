import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
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
  IconButton,
  Switch,
  FormControlLabel,
  Typography,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface SSHConnection {
  id: string;
  name: string;
  hostname: string;
  port: string;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKey?: string;
}

export default function SSHConnectionManager() {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ssh-connections');
      if (!response.ok) throw new Error('Failed to fetch SSH connections');
      const data = await response.json();
      setConnections(data);
    } catch (err) {
      setError('Failed to fetch SSH connections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (connection: SSHConnection) => {
    try {
      const url = connection.id ? `/api/ssh-connections/${connection.id}` : '/api/ssh-connections';
      const method = connection.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection),
      });
      if (!response.ok) throw new Error('Failed to save SSH connection');
      fetchConnections();
      setOpenDialog(false);
      setSnackbarMessage(`SSH connection ${connection.id ? 'updated' : 'added'} successfully`);
      setSnackbarOpen(true);
    } catch (err) {
      setError('Failed to save SSH connection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return;
    try {
      const response = await fetch(`/api/ssh-connections/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete SSH connection');
      fetchConnections();
      setSnackbarMessage('SSH connection deleted successfully');
      setSnackbarOpen(true);
    } catch (err) {
      setError('Failed to delete SSH connection');
    }
  };

  const handleTest = async (connection: SSHConnection) => {
    setTestingConnection(connection.id);
    try {
      const response = await fetch('/api/ssh-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to test SSH connection');
      setSnackbarMessage('SSH connection test successful');
      setSnackbarOpen(true);
    } catch (err) {
      setSnackbarMessage(err instanceof Error ? err.message : 'Failed to test SSH connection');
      setSnackbarOpen(true);
    } finally {
      setTestingConnection(null);
    }
  };

  const ConnectionForm = ({ connection, onSave, onCancel }: { connection: SSHConnection, onSave: (conn: SSHConnection) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState(connection);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Hostname"
          name="hostname"
          value={formData.hostname}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Port"
          name="port"
          value={formData.port}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <FormControlLabel
          control={
            <Switch
              checked={formData.authMethod === 'key'}
              onChange={(e) => setFormData(prev => ({ ...prev, authMethod: e.target.checked ? 'key' : 'password' }))}
              name="authMethod"
            />
          }
          label="Use SSH Key"
        />
        {formData.authMethod === 'password' ? (
          <TextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type="password"
            value={formData.password || ''}
            onChange={handleChange}
          />
        ) : (
          <TextField
            fullWidth
            margin="normal"
            label="Private Key"
            name="privateKey"
            multiline
            rows={4}
            value={formData.privateKey || ''}
            onChange={handleChange}
          />
        )}
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Save</Button>
        </DialogActions>
      </form>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="SSH Connections"
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => {
              setEditingConnection(null);
              setOpenDialog(true);
            }}
          >
            Add New
          </Button>
        }
      />
      <CardContent>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Hostname</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell>{connection.name}</TableCell>
                  <TableCell>{connection.hostname}</TableCell>
                  <TableCell>{connection.port}</TableCell>
                  <TableCell>{connection.username}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        setEditingConnection(connection);
                        setOpenDialog(true);
                      }}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(connection.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      onClick={() => handleTest(connection)}
                      disabled={testingConnection === connection.id}
                      size="small"
                    >
                      {testingConnection === connection.id ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Refresh />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{editingConnection ? 'Edit SSH Connection' : 'Add New SSH Connection'}</DialogTitle>
        <DialogContent>
          <ConnectionForm
            connection={editingConnection || { id: '', name: '', hostname: '', port: '22', username: '', authMethod: 'password' }}
            onSave={(conn) => {
              handleSave(conn);
              setOpenDialog(false);
            }}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Card>
  );
}