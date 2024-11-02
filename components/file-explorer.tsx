"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, File, Folder, Edit, Trash, Copy, Download, Upload } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface SSHConnection {
  id: string
  name: string
  hostname: string
  username: string
}

interface FileItem {
  name: string
  type: "file" | "directory"
  size: number
  modifiedDate: string
}

const FileExplorer = () => {
  const [connections, setConnections] = useState<SSHConnection[]>([])
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string>("/")
  const [files, setFiles] = useState<FileItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [isDualPane, setIsDualPane] = useState(false)
  const [secondPanePath, setSecondPanePath] = useState<string>("/")
  const [secondPaneFiles, setSecondPaneFiles] = useState<FileItem[]>([])

  useEffect(() => {
    fetchConnections()
  }, [])

  useEffect(() => {
    if (selectedConnection) {
      fetchFiles(currentPath)
    }
  }, [selectedConnection, currentPath])

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/ssh-connections")
      if (!response.ok) throw new Error("Failed to fetch SSH connections")
      const data = await response.json()
      setConnections(data)
      if (data.length > 0) {
        setSelectedConnection(data[0].id)
      }
    } catch (err) {
      setError("Failed to fetch SSH connections")
    }
  }

  const fetchFiles = async (path: string) => {
    try {
      const response = await fetch(`/api/files?connectionId=${selectedConnection}&path=${path}`)
      if (!response.ok) throw new Error("Failed to fetch files")
      const data = await response.json()
      setFiles(data)
      setError(null)
    } catch (err) {
      setError("Failed to fetch files")
    }
  }

  const handleFileAction = async (action: string, file: FileItem) => {
    try {
      const response = await fetch(`/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          connectionId: selectedConnection,
          path: currentPath,
          fileName: file.name,
        }),
      })
      if (!response.ok) throw new Error(`Failed to ${action} file`)
      fetchFiles(currentPath)
    } catch (err) {
      setError(`Failed to ${action} file`)
    }
  }

  const handleEdit = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/content?connectionId=${selectedConnection}&path=${currentPath}/${file.name}`)
      if (!response.ok) throw new Error("Failed to fetch file content")
      const content = await response.text()
      setEditContent(content)
      setIsEditing(true)
      setSelectedFile(file)
    } catch (err) {
      setError("Failed to fetch file content")
    }
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/files/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId: selectedConnection,
          path: `${currentPath}/${selectedFile?.name}`,
          content: editContent,
        }),
      })
      if (!response.ok) throw new Error("Failed to save file content")
      setIsEditing(false)
      setSelectedFile(null)
      fetchFiles(currentPath)
    } catch (err) {
      setError("Failed to save file content")
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("connectionId", selectedConnection || "")
    formData.append("path", currentPath)

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Failed to upload file")
      fetchFiles(currentPath)
    } catch (err) {
      setError("Failed to upload file")
    }
  }

  const renderFileList = (files: FileItem[], isSecondPane: boolean = false) => (
    <ScrollArea className="h-[500px] w-full">
      {files.map((file) => (
        <div key={file.name} className="flex items-center justify-between p-2 hover:bg-accent">
          <div className="flex items-center gap-2">
            {file.type === "directory" ? <Folder className="h-4 w-4" /> : <File className="h-4 w-4" />}
            <span>{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {file.type === "file" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(file)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleFileAction("delete", file)}>
                  <Trash className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleFileAction("copy", file)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleFileAction("download", file)}>
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            {file.type === "directory" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isSecondPane ? setSecondPanePath(`${secondPanePath}/${file.name}`) : setCurrentPath(`${currentPath}/${file.name}`)}
              >
                Open
              </Button>
            )}
          </div>
        </div>
      ))}
    </ScrollArea>
  )

  return (
    <Card className="w-full">
      <CardContent>
        <Tabs value={selectedConnection || ""} onValueChange={setSelectedConnection}>
          <TabsList>
            {connections.map((conn) => (
              <TabsTrigger key={conn.id} value={conn.id}>
                {conn.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {connections.map((conn) => (
            <TabsContent key={conn.id} value={conn.id}>
              <div className="flex justify-between items-center mb-4">
                <Input
                  value={currentPath}
                  onChange={(e) => setCurrentPath(e.target.value)}
                  className="w-1/2"
                />
                <div>
                  <Button variant="outline" onClick={() => setIsDualPane(!isDualPane)}>
                    {isDualPane ? "Single Pane" : "Dual Pane"}
                  </Button>
                  <label htmlFor="file-upload" className="ml-2">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className={`flex ${isDualPane ? "space-x-4" : ""}`}>
                <div className={isDualPane ? "w-1/2" : "w-full"}>
                  {renderFileList(files)}
                </div>
                {isDualPane && (
                  <div className="w-1/2">
                    <Input
                      value={secondPanePath}
                      onChange={(e) => setSecondPanePath(e.target.value)}
                      className="mb-4"
                    />
                    {renderFileList(secondPaneFiles, true)}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editing {selectedFile?.name}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[300px]"
            />
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default FileExplorer
