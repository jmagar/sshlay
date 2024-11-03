/**
 * Test API route for error handling and logging
 * Tests different error scenarios and logging functionality
 */

import { NextResponse } from 'next/server';
import { AppError } from '../../../lib/error-handler';

/**
 * Helper to log errors to console and file
 */
const logError = async (error: Error, context: Record<string, any> = {}) => {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    type: error.constructor.name,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    context
  };

  // Log to console
  console.error('\x1b[31m[ERROR]\x1b[0m', JSON.stringify(errorDetails, null, 2));

  // Log to file
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'error.log');

    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(
      logFile,
      JSON.stringify(errorDetails) + '\n'
    );
  } catch (err) {
    console.error('Failed to write to error log:', err);
  }
};

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const errorType = searchParams.get('type') || 'operational';

  try {
    switch (errorType) {
      case 'operational':
        // Test operational error
        throw new AppError('Test operational error', 400, {
          testId: '123',
          testType: 'operational'
        });

      case 'critical':
        // Test critical error
        throw new AppError('Test critical error', 500, {
          testId: '456',
          testType: 'critical'
        });

      case 'unhandled':
        // Test unhandled error
        throw new Error('Test unhandled error');

      case 'async':
        // Test async error
        await new Promise((_, reject) => {
          setTimeout(() => {
            reject(new AppError('Test async error', 503, {
              testId: '789',
              testType: 'async'
            }));
          }, 100);
        });

      default:
        return NextResponse.json({ message: 'No error triggered' });
    }
  } catch (error) {
    // Log the error
    await logError(error, {
      url: req.url,
      method: req.method,
      errorType,
      headers: Object.fromEntries(req.headers.entries()),
      query: Object.fromEntries(searchParams.entries())
    });

    // Return appropriate response based on error type
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          status: 'error',
          message: error.message,
          ...(process.env.NODE_ENV === 'development' && {
            details: {
              type: error.constructor.name,
              metadata: error.metadata,
              stack: error.stack
            }
          })
        },
        { status: error.statusCode }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            type: error.constructor.name,
            message: error.message,
            stack: error.stack
          }
        })
      },
      { status: 500 }
    );
  }
}
