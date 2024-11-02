import React, { useState, useEffect, useRef } from 'react';
import { TextField, Paper, Typography } from '@mui/material';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    const socket = new WebSocket('ws://your-backend-url/terminal');

    socket.onopen = () => {
      term.writeln('Connected to the server');
    };

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    socket.onerror = (error) => {
      setError('WebSocket error: ' + error);
    };

    term.onData((data) => {
      socket.send(data);
    });

    return () => {
      socket.close();
      term.dispose();
    };
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Terminal
      </Typography>
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      <div ref={terminalRef} style={{ flex: 1 }} />
    </Paper>
  );
}