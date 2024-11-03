import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { Container, Typography, CircularProgress } from '@mui/material'
import SSHConnectionForm from '../components/SSHConnectionForm'
import DockerManagement from '../components/DockerManagement'
import FileExplorer from '../components/FileExplorer'
import Terminal from '../components/Terminal'
import Logs from '../components/Logs'

export default function DynamicPage() {
  const router = useRouter()
  const { id } = router.query
  const [pageType, setPageType] = useState<'ssh' | 'docker' | null>(null)

  useEffect(() => {
    if (id) {
      // Determine the page type based on the id
      // This is a placeholder logic, adjust according to your routing strategy
      setPageType(id.toString().startsWith('ssh') ? 'ssh' : 'docker')
    }
  }, [id])

  if (!pageType) {
    return <CircularProgress />
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        {pageType === 'ssh' ? 'SSH Connection' : 'Docker Management'}
      </Typography>
      {pageType === 'ssh' ? (
        <>
          <SSHConnectionForm />
          <FileExplorer />
          <Terminal />
          <Logs />
        </>
      ) : (
        <DockerManagement />
      )}
    </Container>
  )
}