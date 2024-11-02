import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const connection = await db.collection('ssh_connections').findOne({ _id: new ObjectId(params.id) })

    if (!connection) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    return NextResponse.json(connection)
  } catch (error) {
    console.error('Error fetching SSH connection:', error)
    return NextResponse.json({ error: 'Failed to fetch SSH connection' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { name, hostname, port, username, authMethod, password, privateKey } = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection('ssh_connections').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { name, hostname, port, username, authMethod, password, privateKey, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'SSH connection updated successfully' })
  } catch (error) {
    console.error('Error updating SSH connection:', error)
    return NextResponse.json({ error: 'Failed to update SSH connection' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const result = await db.collection('ssh_connections').deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'SSH connection not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'SSH connection deleted successfully' })
  } catch (error) {
    console.error('Error deleting SSH connection:', error)
    return NextResponse.json({ error: 'Failed to delete SSH connection' }, { status: 500 })
  }
}
