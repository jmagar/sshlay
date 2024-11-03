'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import type { SSHConnection } from '../types';

// Import types only
import type { Terminal as XTerm } from '@xterm/xterm';
import type { FitAddon } from '@xterm/addon-fit';
import type { WebLinksAddon } from '@xterm/addon-web-links';
import type { SearchAddon } from '@xterm/addon-search';

interface TerminalProps {
  connectionId?: string;
}

export default function Terminal({ connectionId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<any>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [connections, setConnections] = useState<SSHConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>(connectionId || '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (selectedConnection) {
      initializeTerminal();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [selectedConnection]);

  const fetchConnections = async () => {
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

  const initializeTerminal = async () => {
    if (!terminalRef.current || !selectedConnection || typeof window === 'undefined') return;

    try {
      // Dynamically import xterm and addons
      const [
        { Terminal },
        { FitAddon },
        { WebLinksAddon },
        { SearchAddon }
      ] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
        import('@xterm/addon-web-links'),
        import('@xterm/addon-search')
      ]);

      // Import xterm CSS
      await import('@xterm/xterm/css/xterm.css');

      // Initialize terminal
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4'
        }
      });
      xtermRef.current = term;

      // Add addons
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      const webLinksAddon = new WebLinksAddon();
      const searchAddon = new SearchAddon();

      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);
      term.loadAddon(searchAddon);

      // Open terminal
      term.open(terminalRef.current);
      fitAddon.fit();

      // Initialize WebSocket connection
      const { io } = await import('socket.io-client');
      const socket = io('http://localhost:3001', {
        query: { connectionId: selectedConnection }
      });

      socketRef.current = socket;

      // Handle terminal input
      term.onData((data: string) => {
        socket.emit('terminal:input', data);
      });

      // Handle terminal resize
      term.onResize((size: { cols: number; rows: number }) => {
        socket.emit('terminal:resize', size);
      });

      // Handle terminal output
      socket.on('terminal:output', (data: string) => {
        term.write(data);
      });

      // Handle errors
      socket.on('error', (err: Error) => {
        setError(`Terminal error: ${err.message}`);
      });

      // Handle connection status
      socket.on('connect', () => {
        term.write('\r\nConnected to terminal\r\n');
      });

      socket.on('disconnect', () => {
        term.write('\r\nDisconnected from terminal\r\n');
      });

      // Handle window resize
      const handleResize = () => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      };

      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    } catch (err) {
      setError('Failed to initialize terminal');
      console.error('Terminal initialization error:', err);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-[400px]">
            <Typography>Loading terminal...</Typography>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h5" component="div">
            Terminal
          </Typography>
          <FormControl variant="outlined" sx={{ minWidth: 200 }}>
            <InputLabel>SSH Connection</InputLabel>
            <Select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value as string)}
              label="SSH Connection"
            >
              <MenuItem value="">
                <em>Select a connection</em>
              </MenuItem>
              {connections.map((conn) => (
                <MenuItem key={conn._id} value={conn._id}>
                  {conn.name} ({conn.hostname})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div
          ref={terminalRef}
          className="border rounded"
          style={{
            height: '400px',
            backgroundColor: '#1e1e1e'
          }}
        />
      </CardContent>
    </Card>
  );
}
