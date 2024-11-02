import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Client } from 'ssh2'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const connectionId = searchParams.get('connectionId')

  if (!connectionId) {
    return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
  }

  try {
    const { db } = await connectToDatabase()
    const connection = await db.collection('ssh_connections').findOne({ _id: connectionId })

    if (!connection) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    const containers = await listContainers(connection)
    return NextResponse.json(containers)
  } catch (error) {
    console.error('Error listing Docker containers:', error)
    return NextResponse.json({ error: 'Failed to list Docker containers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { action, containerId, connectionId } = await req.json()

  if (!action || !containerId || !connectionId) {
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
      case 'start':
        result = await executeDockerCommand(connection, `docker start ${containerId}`)
        break
      case 'stop':
        result = await executeDockerCommand(connection, `docker stop ${containerId}`)
        break
      case 'restart':
        result = await executeDockerCommand(connection, `docker restart ${containerId}`)
        break
      case 'remove':
        result = await executeDockerCommand(connection, `docker rm -f ${containerId}`)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error(`Error performing Docker action:`, error)
    return NextResponse.json({ error: `Failed to perform Docker action` }, { status: 500 })
  }
}

async function listContainers(connection: any): Promise<any[]> {
  const command = 'docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Status}}\\t{{.Image}}"'
  const output = await executeDockerCommand(connection, command)

  return output.split('\n').filter(Boolean).map(line => {
    const [id, name, status, image] = line.split('\t')
    return { id, name, status, image }
  })
}

async function executeDockerCommand(connection: any, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new Client()
    client.on('ready', () => {
      client.exec(command, (err, stream) => {
        if (err) {
          client.end()
          return reject(err)
        }
        let output = ''
        stream.on('close', () => {
          client.end()
          resolve(output)
        }).on('data', (data) => {
          output += data
        }).stderr.on('data', (data) => {
          output += data
        })
      })
    }).connect(connection)
  })
}
