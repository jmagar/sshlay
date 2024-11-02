import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

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
            startIcon={<SearchIcon />}
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
      </CardContent>
    </Card>
  );
}