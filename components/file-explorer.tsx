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
  CircularProgress
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface FileItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Files
        </Typography>
        <List>
          {files.map((file) => (
            <ListItem
              key={file.name}
              secondaryAction={
                <>
                  <IconButton edge="end" aria-label="edit" sx={{ mr: 1 }}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemIcon>
                {file.type === 'directory' ? <FolderIcon /> : <FileIcon />}
              </ListItemIcon>
              <ListItemText
                primary={file.name}
                secondary={file.size ? `Size: ${file.size} bytes` : undefined}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}