import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Checkbox, FormControlLabel, Typography, 
  Card, CardContent, CircularProgress, Box 
} from '@mui/material';
import { UploadFile, Code } from '@mui/icons-material';
import { Device, ExecutionResult } from '../types';

interface RemoteCodeExecutionProps {
  onExecute: (code: string, devices: string[]) => Promise<ExecutionResult>;
  fetchDevices: () => Promise<Device[]>;
}

const RemoteCodeExecution: React.FC<RemoteCodeExecutionProps> = ({ onExecute, fetchDevices }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [code, setCode] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const fetchedDevices = await fetchDevices();
        setDevices(fetchedDevices);
      } catch (err) {
        setError('Failed to fetch devices. Please try again.');
      }
    };
    loadDevices();
  }, [fetchDevices]);

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
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
    setExecutionResult(null);
    try {
      const result = await onExecute(code, selectedDevices);
      setExecutionResult(result.output);
    } catch (err) {
      setError('Failed to execute code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Remote Code Execution</Typography>
        <Box mb={2}>
          <Typography variant="subtitle1">Select Devices:</Typography>
          {devices.map(device => (
            <FormControlLabel
              key={device.id}
              control={
                <Checkbox
                  checked={selectedDevices.includes(device.id)}
                  onChange={() => handleDeviceSelection(device.id)}
                />
              }
              label={`${device.name} (${device.type})`}
            />
          ))}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={10}
          variant="outlined"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter your code here or upload a file"
          margin="normal"
        />
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
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecute}
            disabled={isLoading || selectedDevices.length === 0 || !code}
            startIcon={<Code />}
          >
            Execute Code
          </Button>
        </Box>
        {isLoading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        {executionResult && (
          <TextField
            fullWidth
            multiline
            rows={5}
            variant="outlined"
            value={executionResult}
            InputProps={{ readOnly: true }}
            margin="normal"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RemoteCodeExecution;