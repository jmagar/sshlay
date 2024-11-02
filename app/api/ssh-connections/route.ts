import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Client } from 'ssh2';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const connections = await prisma.sSHConnection.findMany();
    return NextResponse.json(connections);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const connection = await prisma.sSHConnection.create({
      data: {
        name: data.name,
        hostname: data.hostname,
        port: parseInt(data.port),
        username: data.username,
        password: data.password,
        privateKey: data.privateKey,
      },
    });
    return NextResponse.json(connection);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
  }
}