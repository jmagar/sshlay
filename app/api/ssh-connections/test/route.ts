import { NextResponse } from 'next/server'
import { Client } from 'ssh2'

export async function POST(req: Request) {
  try {
    const { hostname, port, username, authMethod, password, privateKey } = await req.json()

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

    return NextResponse.json({ message: 'SSH connection test successful' })
  } catch (error) {
    console.error('Error testing SSH connection:', error)
    return NextResponse.json({ error: 'Failed to test SSH connection' }, { status: 500 })
  }
}
