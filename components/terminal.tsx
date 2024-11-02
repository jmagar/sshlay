import React, { useEffect, useRef } from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm();
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    // Here you would typically set up your WebSocket connection
    // and handle sending/receiving data

    return () => {
      term.dispose();
    };
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Terminal
        </Typography>
        <div ref={terminalRef} style={{ height: '400px' }} />
      </CardContent>
    </Card>
  );
}