import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

export async function getSSHConnections() {
  const { db } = await connectToDatabase();
  return db.collection('ssh_connections').find().toArray();
}

export async function getSSHConnection(id) {
  const { db } = await connectToDatabase();
  return db.collection('ssh_connections').findOne({ _id: new ObjectId(id) });
}

export async function addSSHConnection(connection) {
  const { db } = await connectToDatabase();
  const result = await db.collection('ssh_connections').insertOne(connection);
  return { ...connection, _id: result.insertedId };
}

export async function deleteSSHConnection(id) {
  const { db } = await connectToDatabase();
  await db.collection('ssh_connections').deleteOne({ _id: new ObjectId(id) });
}

export async function testSSHConnection(connection) {
  // Implementation for testing SSH connection
  // This would typically try to establish a connection and return success/failure
  return true;
}
