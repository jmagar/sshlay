import { connectToDatabase } from '../db.js';
import { ObjectId } from 'mongodb';

export async function getDevices() {
  const { db } = await connectToDatabase();
  return db.collection('devices').find().toArray();
}

export async function addDevice(device) {
  const { db } = await connectToDatabase();
  const result = await db.collection('devices').insertOne(device);
  return { ...device, _id: result.insertedId };
}

export async function getDevice(id) {
  const { db } = await connectToDatabase();
  return db.collection('devices').findOne({ _id: new ObjectId(id) });
}

export async function updateDevice(id, update) {
  const { db } = await connectToDatabase();
  const result = await db.collection('devices').findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: 'after' }
  );
  return result.value;
}

export async function deleteDevice(id) {
  const { db } = await connectToDatabase();
  await db.collection('devices').deleteOne({ _id: new ObjectId(id) });
}

export async function getDevicesByType(type) {
  const { db } = await connectToDatabase();
  return db.collection('devices').find({ type }).toArray();
}

export async function updateDeviceStatus(id, status) {
  const { db } = await connectToDatabase();
  await db.collection('devices').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        lastSeen: new Date()
      }
    }
  );
}
