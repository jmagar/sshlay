import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Paper,
  Typography,
  CircularProgress,
  Button,
  Grid
} from '@mui/material';
import FileExplorer from '@/components/file-explorer';
import Terminal from '@/components/terminal';
import DockerManagement from '@/components/docker-management';
import Logs from '@/components/logs';

interface Connection {
  id: string;
  name: string;
  hostname: string;
}

export default function ConnectionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchConnection();
    }
  }, [id]);

  const fetchConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ssh-connections/${id}`);
      if (!response.ok) throw new Error('Failed to fetch connection details');
      const data = await response.json();
      setConnection(data);
    } catch (err) {
      setError('Failed to fetch connection details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error || !connection) {
    return <Typography color="error">{error || 'Connection not found'}</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {connection.name}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        {connection.hostname}
      </Typography>
      <Button variant="outlined" onClick={() => router.push('/connections')}>
        Back to Connections
      </Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <FileExplorer />
        </Grid>
        <Grid item xs={12} md={6}>
          <Terminal />
        </Grid>
        <Grid item xs={12}>
          <DockerManagement />
        </Grid>
        <Grid item xs={12}>
          <Logs />
        </Grid>
      </Grid>
    </Paper>
  );
}
