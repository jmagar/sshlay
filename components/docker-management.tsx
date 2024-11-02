"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Play, Square, RefreshCw, Trash } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SSHConnection {
  id: string
  name: string
}

interface DockerContainer {
  id: string
  name: string
  status: string
  image: string
}

export default function DockerManagement() {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [containers, setContainers] = useState<DockerContainer[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConnections()
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      fetchContainers()
    }
  }, [selectedConnection])

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/ssh-connections")
      if (!response.ok) throw new Error("Failed to fetch SSH connections")
      const data = await response.json()
      setConnections(data)
    } catch (err) {
      setError("Failed to fetch SSH connections")
    }
  }

  const fetchContainers = async () => {
    try {
      const response = await fetch(`/api/docker/containers?connectionId=${selectedConnection}`)
      if (!response.ok) throw new Error("Failed to fetch Docker containers")
      const data = await response.json()
      setContainers(data)
    } catch (err) {
      setError("Failed to fetch Docker containers")
    }
  }

  const handleContainerAction = async (action: string, containerId: string) => {
    try {
      const response = await fetch("/api/docker/containers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          containerId,
          connectionId: selectedConnection,
        }),
      })
      if (!response.ok) throw new Error(`Failed to ${action} container`)
      fetchContainers()
    } catch (err) {
      setError(`Failed to ${action} container`)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Docker Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Select onValueChange={setSelectedConnection}>
          <SelectTrigger className="w-[200px] mb-4">
            <SelectValue placeholder="Select a connection" />
          </SelectTrigger>
          <SelectContent>
            {connections.map((conn) => (
              <SelectItem key={conn.id} value={conn.id}>
                {conn.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {containers.map((container) => (
              <TableRow key={container.id}>
                <TableCell>{container.name}</TableCell>
                <TableCell>{container.status}</TableCell>
                <TableCell>{container.image}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleContainerAction("start", container.id)}
                    disabled={container.status === "running"}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleContainerAction("stop", container.id)}
                    disabled={container.status !== "running"}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleContainerAction("restart", container.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleContainerAction("remove", container.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
