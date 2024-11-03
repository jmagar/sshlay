'use client'

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
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Box
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import type { LogEntry } from '@/types';

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [services, setServices] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchLogs();
    const services = new Set<string>();
    logs.forEach(log => {
      if (log.service) services.add(log.service);
    });
    setServices(Array.from(services));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedService, selectedLevel]);

  const fetchLogs = async () => {
    try {
      setError(null);
      const url = selectedService
        ? `/api/logs/${selectedService}`
        : '/api/logs';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedService) {
      filtered = filtered.filter(log => log.service === selectedService);
    }

    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    setFilteredLogs(filtered);
  };

  const downloadLogs = () => {
    const content = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level}] ${log.service ? `[${log.service}] ` : ''}${log.message}`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'error';
      case 'WARN': return 'warning';
      case 'INFO': return 'info';
      case 'DEBUG': return 'default';
      default: return 'default';
    }
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
          <Typography variant="h5">System Logs</Typography>
          <div className="flex gap-2">
            <IconButton onClick={fetchLogs} title="Refresh">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={downloadLogs} title="Download Logs">
              <DownloadIcon />
            </IconButton>
          </div>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="flex gap-4 mb-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon className="mr-2 text-gray-400" />,
            }}
          />

          <FormControl variant="outlined" style={{ minWidth: 120 }}>
            <InputLabel>Service</InputLabel>
            <Select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              label="Service"
            >
              <MenuItem value="">All</MenuItem>
              {services.map(service => (
                <MenuItem key={service} value={service}>{service}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl variant="outlined" style={{ minWidth: 120 }}>
            <InputLabel>Level</InputLabel>
            <Select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              label="Level"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="INFO">Info</MenuItem>
              <MenuItem value="WARN">Warning</MenuItem>
              <MenuItem value="ERROR">Error</MenuItem>
              <MenuItem value="DEBUG">Debug</MenuItem>
            </Select>
          </FormControl>
        </div>

        <List>
          {filteredLogs.map((log, index) => (
            <ListItem
              key={index}
              divider
              className={`hover:bg-gray-50 ${
                log.level === 'ERROR' ? 'bg-red-50' :
                log.level === 'WARN' ? 'bg-yellow-50' :
                ''
              }`}
            >
              <ListItemText
                primary={
                  <div className="flex items-center gap-2">
                    <Chip
                      label={log.level}
                      size="small"
                      color={getLevelColor(log.level) as any}
                    />
                    {log.service && (
                      <Chip
                        label={log.service}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    <Typography component="span" className="font-mono">
                      {log.message}
                    </Typography>
                  </div>
                }
                secondary={
                  <Typography variant="body2" className="text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {filteredLogs.length === 0 && (
          <Typography className="text-center py-8 text-gray-500">
            No logs found matching your criteria
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
