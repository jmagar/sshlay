"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Pencil, Trash, Plus, Check, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

interface SSHConnection {
  id: string
  name: string
  hostname: string
  port: string
  username: string
  authMethod: "password" | "key"
  password?: string
  privateKey?: string
}

export default function SSHConnectionManager() {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [editingConnection, setEditingConnection] = useState<SSHConnection | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchConnections()
  }, [])

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

  const handleSave = async (connection: SSHConnection) => {
    try {
      const url = connection.id ? `/api/ssh-connections/${connection.id}` : "/api/ssh-connections"
      const method = connection.id ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connection),
      })
      if (!response.ok) throw new Error("Failed to save SSH connection")
      fetchConnections()
      setEditingConnection(null)
      setIsAddingNew(false)
      toast({
        title: "Success",
        description: `SSH connection ${connection.id ? "updated" : "added"} successfully`,
      })
    } catch (err) {
      setError("Failed to save SSH connection")
      toast({
        title: "Error",
        description: "Failed to save SSH connection",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return
    try {
      const response = await fetch(`/api/ssh-connections/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete SSH connection")
      fetchConnections()
      toast({
        title: "Success",
        description: "SSH connection deleted successfully",
      })
    } catch (err) {
      setError("Failed to delete SSH connection")
      toast({
        title: "Error",
        description: "Failed to delete SSH connection",
        variant: "destructive",
      })
    }
  }

  const handleTest = async (connection: SSHConnection) => {
    setTestingConnection(connection.id)
    try {
      const response = await fetch("/api/ssh-connections/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connection),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to test SSH connection")
      toast({
        title: "Success",
        description: "SSH connection test successful",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to test SSH connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const ConnectionForm = ({ connection, onSave, onCancel }: { connection: SSHConnection, onSave: (conn: SSHConnection) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState(connection)

    return (
      <form onSubmit={(e) => { e.preventDefault(); onSave(formData) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname</Label>
            <Input
              id="hostname"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="auth-method"
              checked={formData.authMethod === "key"}
              onCheckedChange={(checked) => setFormData({ ...formData, authMethod: checked ? "key" : "password" })}
            />
            <Label htmlFor="auth-method">Use SSH Key</Label>
          </div>
        </div>
        {formData.authMethod === "password" ? (
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password || ""}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="privateKey">Private Key</Label>
            <Textarea
              id="privateKey"
              value={formData.privateKey || ""}
              onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
              className="h-32"
            />
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          SSH Connections
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddingNew(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New SSH Connection</DialogTitle>
              </DialogHeader>
              <ConnectionForm
                connection={{ id: "", name: "", hostname: "", port: "22", username: "", authMethod: "password" }}
                onSave={handleSave}
                onCancel={() => setIsAddingNew(false)}
              />
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <TableHead>Hostname</TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((connection) => (
              <TableRow key={connection.id}>
                <TableCell>{connection.name}</TableCell>
                <TableCell>{connection.hostname}</TableCell>
                <TableCell>{connection.port}</TableCell>
                <TableCell>{connection.username}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingConnection(connection)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit SSH Connection</DialogTitle>
                        </DialogHeader>
                        <ConnectionForm
                          connection={connection}
                          onSave={handleSave}
                          onCancel={() => setEditingConnection(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(connection.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(connection)}
                      disabled={testingConnection === connection.id}
                    >
                      {testingConnection === connection.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                      ) : (
                        "Test"
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
