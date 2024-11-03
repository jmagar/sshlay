/**
 * SSH Connection by ID API Routes
 *
 * Handles operations for individual SSH connections:
 * - GET: Retrieve connection details
 * - PUT: Update connection
 * - DELETE: Remove connection
 *
 * Uses MongoDB for storage and includes error handling with logging
 */

import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import { AppError, errorHandler } from '../../../../lib/error-handler';
import { ObjectId } from 'mongodb';

/**
 * Helper to create API request object for error handler
 */
const createApiRequest = (method: string, url: string, body?: any) => ({
  method,
  url,
  body,
  headers: {},
  query: {}
});

/**
 * GET /api/ssh-connections/[id]
 * Retrieves a specific SSH connection by ID
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      throw new AppError('Invalid connection ID', 400, { id: params.id });
    }

    const connection = await db.collection('ssh_connections')
      .findOne({ _id: new ObjectId(params.id) });

    if (!connection) {
      throw new AppError('SSH connection not found', 404, { id: params.id });
    }

    return NextResponse.json(connection);
  } catch (error) {
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
      error instanceof AppError ? error :
      new AppError('Failed to fetch SSH connection', 500, { error, id: params.id }),
      createApiRequest('GET', `/api/ssh-connections/${params.id}`) as any,
      res as any
    );

    return NextResponse.json(responseBody, { status: statusCode });
  }
}

/**
 * PUT /api/ssh-connections/[id]
 * Updates a specific SSH connection
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      throw new AppError('Invalid connection ID', 400, { id: params.id });
    }

    // Validate required fields
    if (!data.name || !data.hostname || !data.username) {
      throw new AppError('Missing required fields', 400, {
        required: ['name', 'hostname', 'username'],
        received: Object.keys(data)
      });
    }

    // Check for duplicate name, excluding current connection
    const duplicate = await db.collection('ssh_connections').findOne({
      _id: { $ne: new ObjectId(params.id) },
      name: data.name
    });

    if (duplicate) {
      throw new AppError('Connection name already exists', 409, {
        name: data.name
      });
    }

    const result = await db.collection('ssh_connections').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name: data.name,
          hostname: data.hostname,
          port: parseInt(data.port) || 22,
          username: data.username,
          password: data.password,
          privateKey: data.privateKey,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new AppError('SSH connection not found', 404, { id: params.id });
    }

    return NextResponse.json({ message: 'SSH connection updated successfully' });
  } catch (error) {
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
      error instanceof AppError ? error :
      new AppError('Failed to update SSH connection', 500, { error, id: params.id }),
      createApiRequest('PUT', `/api/ssh-connections/${params.id}`, req.body) as any,
      res as any
    );

    return NextResponse.json(responseBody, { status: statusCode });
  }
}

/**
 * DELETE /api/ssh-connections/[id]
 * Removes a specific SSH connection
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase();

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      throw new AppError('Invalid connection ID', 400, { id: params.id });
    }

    const result = await db.collection('ssh_connections').deleteOne({
      _id: new ObjectId(params.id)
    });

    if (result.deletedCount === 0) {
      throw new AppError('SSH connection not found', 404, { id: params.id });
    }

    return NextResponse.json({ message: 'SSH connection deleted successfully' });
  } catch (error) {
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
      error instanceof AppError ? error :
      new AppError('Failed to delete SSH connection', 500, { error, id: params.id }),
      createApiRequest('DELETE', `/api/ssh-connections/${params.id}`) as any,
      res as any
    );

    return NextResponse.json(responseBody, { status: statusCode });
  }
}
