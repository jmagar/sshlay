'use client'

import React, { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, Typography, Button, Box } from "@mui/material"

const SocketSetup: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", {
      path: "/socket.io",
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.io server")
      setLogs(prev => [...prev, "Connected to server"])
    })

    socketInstance.on("docker:logs", (message: string) => {
      setLogs(prev => [...prev, `Docker: ${message}`])
    })

    socketInstance.on("ssh:output", (message: string) => {
      setLogs(prev => [...prev, `SSH: ${message}`])
    })

    socketInstance.on("disconnect", () => {
      setLogs(prev => [...prev, "Disconnected from server"])
    })

    socketInstance.on("connect_error", (err: Error) => {
      console.error("Connection error:", err)
      setError("Failed to connect to the server. Please try again.")
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const reconnect = () => {
    if (socket) {
      socket.connect()
    }
  }

  return (
    <Card>
      <CardHeader title="Real-time Logs" />
      <CardContent>
        {error && <Typography color="error">{error}</Typography>}
        <Box sx={{ height: 400, overflowY: 'auto', border: 1, borderColor: 'grey.300', borderRadius: 1, p: 2 }}>
          {logs.map((log, index) => (
            <Typography key={index} variant="body2" fontFamily="monospace">
              {log}
            </Typography>
          ))}
        </Box>
        {error && (
          <Box mt={2}>
            <Button onClick={reconnect} variant="contained" color="primary">
              Reconnect
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default SocketSetup