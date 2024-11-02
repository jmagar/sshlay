import { NextResponse } from 'next/server'
import { Client } from 'ssh2'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const connectionId = searchParams.get('connectionId')
  const path = searchParams.get('path')

  if (!connectionId || !path) {
    return NextResponse.json({ error: 'Missing connectionId or path' }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const connection = await db.collection('ssh_connections').findOne({ _id: connectionId })

    if (!connection) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    const files = await listFiles(connection, path)
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { action, connectionId, path, fileName } = await req.json()

  if (!connectionId || !path || !fileName || !action) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const connection = await db.collection('ssh_connections').findOne({ _id: connectionId })

    if (!connection) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    let result
    switch (action) {
      case 'delete':
        result = await deleteFile(connection, `${path}/${fileName}`)
        break
      case 'copy':
        // Implement copy logic
        break
      case 'download':
        result = await downloadFile(connection, `${path}/${fileName}`)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error(`Error performing ${action}:`, error)
    return NextResponse.json({ error: `Failed to ${action} file` }, { status: 500 })
  }
}

async function listFiles(connection: any, path: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(err)
        }
        sftp.readdir(path, (err, list) => {
          client.end()
          if (err) return reject(err)
          resolve(list.map(item => ({
            name: item.filename,
            type: item.attrs.isDirectory() ? 'directory' : 'file',
            size: item.attrs.size,
            modifiedDate: new Date(item.attrs.mtime * 1000).toISOString()
          })))
        })
      })
    }).connect(connection)
  })
}

async function deleteFile(connection: any, filePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(err)
        }

        sftp.unlink(filePath, (err) => {
          client.end()
          if (err) return reject(err)
          resolve(true)
        })
      })
    }).connect(connection)
  })
}

async function downloadFile(connection: any, filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(err)
        }
        sftp.readFile(filePath, (err, data) => {
          client.end()
          if (err) return reject(err)
          resolve(data)
        })
      })
    }).connect(connection)
  })
}
