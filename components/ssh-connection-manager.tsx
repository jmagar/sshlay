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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as TestIcon
} from '@mui/icons-material';

interface SSHConnection {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
}

export default function SSHConnectionManager() {
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

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
    // Implementation for saving connection
  };

  const handleDelete = async (id: string) => {
    // Implementation for deleting connection
  };

  const handleTest = async (connection: SSHConnection) => {
    // Implementation for testing connection
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
          SSH Connections
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 2 }}
        >
          Add New Connection
        </Button>
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
                    <IconButton onClick={() => {
                      setEditingConnection(connection);
                      setOpenDialog(true);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(connection.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleTest(connection)}
                      disabled={testingConnection === connection.id}
                    >
                      {testingConnection === connection.id ? (
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
      </CardContent>
      {/* Add Dialog for adding/editing connections */}
    </Card>
  );
}