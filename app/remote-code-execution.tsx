"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Code, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Device {
  id: string
  name: string
  type: "ssh" | "docker"
}

export default function RemoteCodeExecution() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevices, setSelectedDevices] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const [executionResult, setExecutionResult] = useState<string>("")

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/devices")
      if (!response.ok) throw new Error("Failed to fetch devices")
      const data = await response.json()
      setDevices(data)
    } catch (err) {
      setError("Failed to fetch devices")
    }
  }

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    )
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCode(content)
      }
      reader.readAsText(uploadedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setCode(content)
      }
      reader.readAsText(droppedFile)
    }
  }

  const handleExecute = async () => {
    if (selectedDevices.length === 0) {
      setError("Please select at least one device")
      return
    }
    if (!code.trim()) {
      setError("Please enter some code to execute")
      return
    }

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devices: selectedDevices,
          code,
        }),
      })

      if (!response.ok) throw new Error("Execution failed")

      const result = await response.json()
      setExecutionResult(JSON.stringify(result, null, 2))
    } catch (err) {
      setError("Failed to execute code on selected devices")
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Remote Code Execution
        </CardTitle>
        <CardDescription>
          Select devices, enter code, and execute remotely
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Select Devices</Label>
            <ScrollArea className="h-[200px] w-full border rounded-md p-4">
              {devices.map(device => (
                <div key={device.id} className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id={device.id}
                    checked={selectedDevices.includes(device.id)}
                    onCheckedChange={() => handleDeviceSelection(device.id)}
                  />
                  <Label htmlFor={device.id} className="flex items-center gap-2">
                    {device.name}
                    <span className="text-xs text-muted-foreground">({device.type})</span>
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </div>

          <div
            className="border-2 border-dashed rounded-md p-4"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Label htmlFor="code">Code or Script</Label>
            <Textarea
              id="code"
              placeholder="Enter your code here or drag and drop a file"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[200px] mt-2"
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleExecute} className="w-full">
            Execute Code
          </Button>

          {executionResult && (
            <div>
              <Label>Execution Result</Label>
              <ScrollArea className="h-[200px] w-full border rounded-md p-4 mt-2">
                <pre className="whitespace-pre-wrap">{executionResult}</pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
