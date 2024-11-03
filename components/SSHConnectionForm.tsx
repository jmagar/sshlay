import React, { useState } from 'react';
import { 
  Button, TextField, Switch, FormControlLabel, Typography, 
  Card, CardContent, Box 
} from '@mui/material';
import { Key } from '@mui/icons-material';
import { SSHConnection } from '../types';

interface SSHConnectionFormProps {
  onSubmit: (connection: SSHConnection) => Promise<void>;
}

const SSHConnectionForm: React.FC<SSHConnectionFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<SSHConnection>({
    name: '',
    hostname: '',
    port: '22',
    username: '',
    authMethod: 'password',
    password: '',
    privateKey: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await onSubmit(formData);
      // Reset form or show success message
      setFormData({
        name: '',
        hostname: '',
        port: '22',
        username: '',
        authMethod: 'password',
        password: '',
        privateKey: '',
      });
    } catch (err) {
      setError('Failed to add SSH connection. Please check your connection details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          <Key /> Add SSH Connection
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Connection Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Hostname"
            name="hostname"
            value={formData.hostname}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Port"
            name="port"
            value={formData.port}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.authMethod === 'key'}
                onChange={() => setFormData(prev => ({ ...prev, authMethod: prev.authMethod === 'password' ? 'key' : 'password' }))}
              />
            }
            label="Use SSH Key"
          />
          {formData.authMethod === 'password' ? (
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          ) : (
            <TextField
              fullWidth
              label="Private Key"
              name="privateKey"
              multiline
              rows={4}
              value={formData.privateKey}
              onChange={handleInputChange}
              margin="normal"
              required
            />
          )}
          <Box mt={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add SSH Connection'}
            </Button>
          </Box>
          {error && <Typography color="error">{error}</Typography>}
        </form>
      </CardContent>
    </Card>
  );
};

export default SSHConnectionForm;