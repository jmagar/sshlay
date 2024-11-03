'use client'

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  CircularProgress,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import type { FileItem } from '@/types';

export default function FileExplorer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (file: FileItem) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
      if (!response.ok) throw new Error('Failed to fetch file content');
      const { content } = await response.json();
      setFileContent(content);
      setSelectedFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch file content');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileItem) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path);
    } else {
      await fetchFileContent(file);
    }
  };

  const handleSaveContent = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/files/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: fileContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save file');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  const renderBreadcrumbs = () => (
    <Breadcrumbs aria-label="breadcrumb" className="mb-4">
      <Link
        component="button"
        color="inherit"
        onClick={() => setCurrentPath('/')}
      >
        Home
      </Link>
      {pathParts.map((part, index) => {
        const path = '/' + pathParts.slice(0, index + 1).join('/');
        return (
          <Link
            key={path}
            component="button"
            color="inherit"
            onClick={() => setCurrentPath(path)}
          >
            {part}
          </Link>
        );
      })}
    </Breadcrumbs>
  );

  if (loading && !selectedFile) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center p-4">
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">File Explorer</Typography>
          <div>
            <IconButton onClick={() => fetchFiles(currentPath)} title="Refresh">
              <RefreshIcon />
            </IconButton>
            {currentPath !== '/' && (
              <IconButton onClick={handleBack} title="Go back">
                <BackIcon />
              </IconButton>
            )}
          </div>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {renderBreadcrumbs()}

        <List>
          {files.map((file) => (
            <ListItem
              key={file.path}
              button
              onClick={() => handleFileClick(file)}
              secondaryAction={
                <div>
                  {file.type === 'file' && (
                    <>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchFileContent(file).then(() => setIsEditing(true));
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="download"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/api/files/download?path=${encodeURIComponent(file.path)}`);
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </>
                  )}
                </div>
              }
            >
              <ListItemIcon>
                {file.type === 'directory' ? <FolderIcon /> : <FileIcon />}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={
                  <>
                    {file.size && `Size: ${(file.size / 1024).toFixed(2)} KB`}
                    {file.modified && ` • Modified: ${new Date(file.modified).toLocaleString()}`}
                    {file.permissions && ` • ${file.permissions}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>

        <Dialog
          open={!!selectedFile}
          onClose={() => {
            setSelectedFile(null);
            setFileContent('');
            setIsEditing(false);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedFile?.name}
            {isEditing ? ' (Editing)' : ''}
          </DialogTitle>
          <DialogContent>
            {isEditing ? (
              <TextField
                multiline
                fullWidth
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                variant="outlined"
                minRows={20}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded">
                {fileContent}
              </pre>
            )}
          </DialogContent>
          <DialogActions>
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveContent} variant="contained" color="primary">
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setSelectedFile(null)}>Close</Button>
                <Button onClick={() => setIsEditing(true)} variant="contained" color="primary">
                  Edit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
