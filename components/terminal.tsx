'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import io from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';
import type { SSHConnection } from '@/types';

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
    }
  };

  const initializeTerminal = async () => {
    if (!terminalRef.current || !selectedConnection) return;

    try {
      // Initialize terminal
      const term = new XTerm({
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
      const socket = io('http://localhost:3001', {
        query: { connectionId: selectedConnection }
      });

      socketRef.current = socket;

      // Handle terminal input
      term.onData(data => {
        socket.emit('terminal:input', data);
      });

      // Handle terminal resize
      term.onResize(size => {
        socket.emit('terminal:resize', size);
      });

      // Handle terminal output
      socket.on('terminal:output', data => {
        term.write(data);
      });

      // Handle errors
      socket.on('error', (err) => {
        setError(`Terminal error: ${err}`);
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
              onChange={(e) => setSelectedConnection(e.target.value)}
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
