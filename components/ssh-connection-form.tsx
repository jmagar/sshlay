"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Key } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface SSHConnection {
  name: string
  hostname: string
  port: string
  username: string
  authMethod: "password" | "key"
  password: string
  privateKey: string
}

export default function SSHConnectionForm() {
  const [formData, setFormData] = useState<SSHConnection>({
    name: "",
    hostname: "",
    port: "22",
    username: "",
    authMethod: "password",
    password: "",
    privateKey: "",
  })
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/ssh-connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to add SSH connection")
      }

      // Handle successful addition
      console.log("SSH connection added successfully")
    } catch (err) {
      setError("Failed to add SSH connection. Please check your connection details.")
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Add SSH Connection
        </CardTitle>
        <CardDescription>
          Enter the connection details for your SSH server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My SSH Server"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hostname">Hostname</Label>
            <Input
              id="hostname"
              placeholder="example.com or 192.168.1.100"
              value={formData.hostname}
              onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              placeholder="22"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="root"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Authentication Method</Label>
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={formData.authMethod === "password"}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="private-key">Private Key</Label>
              <Textarea
                id="private-key"
                placeholder="Paste your private key here"
                value={formData.privateKey}
                onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                className="min-h-[200px]"
                required={formData.authMethod === "key"}
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full">
            Add SSH Connection
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
