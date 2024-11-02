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

    const content = await getFileContent(connection, path)
    return new NextResponse(content)
  } catch (error) {
    console.error('Error getting file content:', error)
    return NextResponse.json({ error: 'Failed to get file content' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { connectionId, path, content } = await req.json()

  if (!connectionId || !path || content === undefined) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const connection = await db.collection('ssh_connections').findOne({ _id: connectionId })

    if (!connection) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    await saveFileContent(connection, path, content)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving file content:', error)
    return NextResponse.json({ error: 'Failed to save file content' }, { status: 500 })
  }
}

async function getFileContent(connection: any, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(err)
        }
        sftp.readFile(filePath, 'utf8', (err, data) => {
          client.end()
          if (err) return reject(err)
          resolve(data)
        })
      })
    }).connect(connection)
  })
}

async function saveFileContent(connection: any, filePath: string, content: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(err)
        }
        sftp.writeFile(filePath, content, (err) => {
          client.end()
          if (err) return reject(err)
          resolve()
        })
      })
    }).connect(connection)
  })
}
