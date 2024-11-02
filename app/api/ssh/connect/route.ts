import { NextResponse } from 'next/server'
import { Client } from 'ssh2'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(req: Request) {
  try {
    const { hostname, port, username, password, useSSHKey, sshKey } = await req.json()

    const conn = new Client()

    return new Promise((resolve, reject) => {
      conn.on('ready', async () => {
        // Store connection details in MongoDB
        const { db } = await connectToDatabase()
        await db.collection('ssh_connections').insertOne({
          hostname,
          port,
          username,
          useSSHKey,
          // Note: In a production environment, you should encrypt the password and SSH key
          password: useSSHKey ? undefined : password,
          sshKey: useSSHKey ? sshKey : undefined,
          createdAt: new Date()
        })

        resolve(NextResponse.json({ message: 'SSH connection established and saved' }, { status: 200 }))
        conn.end()
      }).on('error', (err) => {
        reject(NextResponse.json({ error: err.message }, { status: 500 }))
      }).connect({
        host: hostname,
        port: parseInt(port),
        username,
        ...(useSSHKey ? { privateKey: sshKey } : { password })
      })
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
