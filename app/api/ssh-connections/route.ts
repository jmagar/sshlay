import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { Client } from 'ssh2'

export async function GET() {
  try {
    const { db } = await connectToDatabase()
    const connections = await db.collection('ssh_connections').find({}).toArray()

    return NextResponse.json(connections.map(conn => ({
      id: conn._id.toString(),
      name: conn.name,
      hostname: conn.hostname,
      port: conn.port,
      username: conn.username,
      authMethod: conn.authMethod
    })))
  } catch (error) {
    console.error('Error fetching SSH connections:', error)
    return NextResponse.json({ error: 'Failed to fetch SSH connections' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, hostname, port, username, authMethod, password, privateKey } = await req.json()

    // Validate the connection
    const client = new Client()
    await new Promise((resolve, reject) => {
      client.on('ready', () => {
        resolve(true)
        client.end()
      }).on('error', (err) => {
        reject(err)
      }).connect({
        host: hostname,
        port: parseInt(port),
        username,
        password: authMethod === 'password' ? password : undefined,
        privateKey: authMethod === 'key' ? privateKey : undefined,
      })
    })

    // Store the SSH connection in MongoDB
    const { db } = await connectToDatabase()
    const result = await db.collection('ssh_connections').insertOne({
      name,
      hostname,
      port,
      username,
      authMethod,
      password: authMethod === 'password' ? password : undefined,
      privateKey: authMethod === 'key' ? privateKey : undefined,
      createdAt: new Date()
    })

    return NextResponse.json({ id: result.insertedId, message: 'SSH connection added successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error adding SSH connection:', error)
    return NextResponse.json({ error: 'Failed to add SSH connection' }, { status: 500 })
  }
}
