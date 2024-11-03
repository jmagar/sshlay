/**
 * SSH Connections API Route
 *
 * Handles CRUD operations for SSH connections:
 * - GET: List all connections
 * - POST: Create new connection
 *
 * Uses MongoDB for storage and includes error handling with logging
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import { AppError, errorHandler } from '../../../lib/error-handler';

/**
 * GET /api/ssh-connections
 * Retrieves all SSH connections
 */
export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const connections = await db.collection('ssh_connections').find().toArray();

    return NextResponse.json(connections);
  } catch (error) {
    // Convert Request/Response for error handler
    const req = {
      method: 'GET',
      url: '/api/ssh-connections'
    };

    let statusCode = 500;
    let responseBody = {};

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        responseBody = body;
        return res;
      }
    };

    await errorHandler(
      new AppError('Failed to fetch SSH connections', 500, { error }),
      req as any,
      res as any
    );

    return NextResponse.json(responseBody, { status: statusCode });
  }
}

/**
 * POST /api/ssh-connections
 * Creates a new SSH connection
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.hostname || !data.username) {
      throw new AppError('Missing required fields', 400, {
        required: ['name', 'hostname', 'username'],
        received: Object.keys(data)
      });
    }

    const { db } = await connectToDatabase();

    // Check for duplicate name
    const existing = await db.collection('ssh_connections').findOne({ name: data.name });
    if (existing) {
      throw new AppError('Connection name already exists', 409, {
        name: data.name
      });
    }

    const connection = {
      name: data.name,
      hostname: data.hostname,
      port: parseInt(data.port) || 22,
      username: data.username,
      password: data.password,
      privateKey: data.privateKey,
      status: 'disconnected',
      createdAt: new Date(),
      lastConnected: null
    };

    const result = await db.collection('ssh_connections').insertOne(connection);

    return NextResponse.json({
      ...connection,
      _id: result.insertedId
    });
  } catch (error) {
    // Convert Request/Response for error handler
    const req = {
      method: 'POST',
      url: '/api/ssh-connections',
      body: request.body
    };

    let statusCode = 500;
    let responseBody = {};

    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        responseBody = body;
        return res;
      }
    };

    await errorHandler(
      error instanceof AppError ? error : new AppError('Failed to create SSH connection', 500, { error }),
      req as any,
      res as any
    );

    return NextResponse.json(responseBody, { status: statusCode });
  }
}
