import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Search } from '@mui/icons-material';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/logs');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError('Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Implement log search functionality
    console.log('Searching for:', searchTerm);
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
        System Logs
      </Typography>
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button
          variant="contained"
          startIcon={<Search />}
          onClick={handleSearch}
          sx={{ ml: 1 }}
        >
          Search
        </Button>
      </div>
      <List>
        {logs.map((log, index) => (
          <ListItem key={index} divider>
            <ListItemText
              primary={log.message}
              secondary={`${log.timestamp} - ${log.level}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}