'use client'

import React, { useState, useEffect } from 'react';
import {
  Button, TextField, Checkbox, FormControlLabel, Typography,
  Card, CardContent, CircularProgress, Box, Alert,
  Select, MenuItem, FormControl, InputLabel, Chip
} from '@mui/material';
import { UploadFile, Code, History as HistoryIcon } from '@mui/icons-material';
import type { Device, ExecutionResult } from '@/types';

interface RemoteCodeExecutionProps {
  onExecute?: (code: string, devices: string[]) => Promise<ExecutionResult>;
}

export default function RemoteCodeExecution({ onExecute }: RemoteCodeExecutionProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [code, setCode] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ExecutionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [executionHistory, setExecutionHistory] = useState<Array<{
    code: string;
    timestamp: Date;
    devices: string[];
  }>>([]);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (!response.ok) throw new Error('Failed to fetch devices');
      const data = await response.json();
      setDevices(data);
    } catch (err) {
      setError('Failed to fetch devices. Please try again.');
    }
  };

  const handleDeviceSelection = (event: any) => {
    setSelectedDevices(event.target.value as string[]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
      };
      reader.readAsText(uploadedFile);
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          devices: selectedDevices,
        }),
      });

      if (!response.ok) throw new Error('Failed to execute code');
      const result = await response.json();

      setResults(result);
      setExecutionHistory(prev => [
        {
          code,
          timestamp: new Date(),
          devices: selectedDevices,
        },
        ...prev.slice(0, 9), // Keep last 10 executions
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute code');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (historyItem: { code: string; devices: string[] }) => {
    setCode(historyItem.code);
    setSelectedDevices(historyItem.devices);
  };

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5">Remote Code Execution</Typography>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            disabled={executionHistory.length === 0}
            onClick={() => {
              if (executionHistory.length > 0) {
                loadFromHistory(executionHistory[0]);
              }
            }}
          >
            Last Execution
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth className="mb-4">
          <InputLabel>Select Devices</InputLabel>
          <Select
            multiple
            value={selectedDevices}
            onChange={handleDeviceSelection}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((deviceId) => {
                  const device = devices.find(d => d._id === deviceId);
                  return (
                    <Chip
                      key={deviceId}
                      label={device ? `${device.name} (${device.type})` : deviceId}
                    />
                  );
                })}
              </Box>
            )}
          >
            {devices.map((device) => (
              <MenuItem key={device._id} value={device._id}>
                <Checkbox checked={selectedDevices.includes(device._id!)} />
                {device.name} ({device.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here or upload a file"
          className="mb-4 font-mono"
        />

        <div className="flex gap-4 mb-4">
          <input
            accept=".txt,.js,.py,.sh"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadFile />}
            >
              Upload File
            </Button>
          </label>
          {file && <Typography variant="body2">{file.name}</Typography>}
        </div>

        <Button
          variant="contained"
          color="primary"
          onClick={handleExecute}
          disabled={isLoading || selectedDevices.length === 0 || !code}
          startIcon={isLoading ? <CircularProgress size={20} /> : <Code />}
          className="mb-4"
        >
          Execute Code
        </Button>

        {results && (
          <div className="space-y-4">
            <Typography variant="h6">Execution Results</Typography>
            {results.results.map((result, index) => {
              const device = devices.find(d => d._id === result.deviceId);
              return (
                <Card key={index} variant="outlined" className="p-4">
                  <Typography variant="subtitle1" className="mb-2">
                    {device ? device.name : result.deviceId}
                  </Typography>
                  <Alert severity={result.success ? "success" : "error"}>
                    {result.success ? (
                      <pre className="whitespace-pre-wrap font-mono">
                        {result.output}
                      </pre>
                    ) : (
                      result.error
                    )}
                  </Alert>
                </Card>
              );
            })}
          </div>
        )}

        {executionHistory.length > 0 && (
          <div className="mt-8">
            <Typography variant="h6" className="mb-4">Execution History</Typography>
            <div className="space-y-2">
              {executionHistory.map((item, index) => (
                <Card key={index} variant="outlined" className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Typography variant="subtitle2">
                        {item.timestamp.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {item.devices.length} device(s)
                      </Typography>
                    </div>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => loadFromHistory(item)}
                    >
                      Load
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
