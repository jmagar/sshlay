"use client"

import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Component() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io("http://localhost:3000", {
      path: "/api/socketio",
    })

    socketInstance.on("connect", () => {
      console.log("Connected to Socket.io server")
      setLogs(prev => [...prev, "Connected to server"])
    })

    socketInstance.on("docker:logs", (message: string) => {
      setLogs(prev => [...prev, message])
    })

    socketInstance.on("ssh:output", (message: string) => {
      setLogs(prev => [...prev, message])
    })

    socketInstance.on("disconnect", () => {
      setLogs(prev => [...prev, "Disconnected from server"])
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Real-time Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
