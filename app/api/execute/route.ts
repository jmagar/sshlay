import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Docker from 'dockerode'
import { Client } from 'ssh2'

export async function POST(req: Request) {
  try {
    const { devices, code } = await req.json()

    const { db } = await connectToDatabase()
    const deviceDocs = await db.collection('devices').find({ _id: { $in: devices } }).toArray()

    const results = await Promise.all(deviceDocs.map(async (device) => {
      if (device.type === 'docker') {
        return executeOnDocker(device, code)
      } else if (device.type === 'ssh') {
        return executeOnSSH(device, code)
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error executing code:', error)
    return NextResponse.json({ error: 'Failed to execute code' }, { status: 500 })
  }
}

async function executeOnDocker(device: any, code: string) {
  const docker = new Docker(device.connectionOptions)
  const container = await docker.createContainer({
    Image: 'alpine',
    Cmd: ['sh', '-c', code],
    Tty: true
  })
  await container.start()
  const output = await container.logs({ stdout: true, stderr: true })
  await container.remove()
  return { device: device.name, output: output.toString() }
}

async function executeOnSSH(device: any, code: string) {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn.on('ready', () => {
      conn.exec(code, (err, stream) => {
        if (err) reject(err)
        let output = ''
        stream.on('close', () => {
          conn.end()
          resolve({ device: device.name, output })
        }).on('data', (data) => {
          output += data
        }).stderr.on('data', (data) => {
          output += data
        })
      })
    }).connect(device.connectionOptions)
  })
}
