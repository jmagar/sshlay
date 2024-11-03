/**
 * Error Handling and Logging Utility
 *
 * Provides centralized error handling and logging functionality:
 * - Custom error classes with status codes
 * - Structured error logging to console and file
 * - Error response formatting
 * - Integration with system logs
 * - Future Gotify notification support
 *
 * Usage:
 * ```typescript
 * import { AppError, errorHandler } from '../lib/error-handler';
 *
 * // Throwing an operational error
 * throw new AppError('Invalid input', 400);
 *
 * // Using in API routes
 * try {
 *   // ... code that might throw
 * } catch (err) {
 *   return errorHandler(err, req, res);
 * }
 * ```
 */

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

// Log levels with corresponding colors for console output
const Colors = {
  Reset: '\x1b[0m',
  Red: '\x1b[31m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Gray: '\x1b[90m'
};

/**
 * Custom error class for application-specific errors
 * Includes status code and operational flag for error handling
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  metadata?: Record<string, any>;

  constructor(message: string, statusCode: number, metadata?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Interface for structured error details
 */
interface ErrorDetails {
  timestamp: string;
  type: string;
  message: string;
  stack?: string;
  statusCode: number;
  isOperational: boolean;
  metadata?: Record<string, any>;
  context?: string;
  request?: {
    method?: string;
    url?: string;
    query?: any;
    headers?: {
      'user-agent'?: string;
      'x-forwarded-for'?: string;
    };
  };
}

/**
 * Format error details for logging
 */
const formatError = (err: AppError | Error, req?: NextApiRequest): ErrorDetails => {
  const timestamp = new Date().toISOString();
  const errorDetails: ErrorDetails = {
    timestamp,
    type: err.constructor.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode: (err as AppError).statusCode || 500,
    isOperational: (err as AppError).isOperational || false,
    metadata: (err as AppError).metadata
  };

  if (req) {
    errorDetails.request = {
      method: req.method,
      url: req.url,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'] as string,
        'x-forwarded-for': req.headers['x-forwarded-for'] as string
      }
    };
  }

  return errorDetails;
};

/**
 * Write error log to file
 */
const logToFile = async (errorDetails: ErrorDetails) => {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'error.log');

    // Ensure log directory exists
    await fs.mkdir(logDir, { recursive: true });

    // Append log entry
    const logEntry = JSON.stringify(errorDetails) + '\n';
    await fs.appendFile(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write to error log file:', err);
  }
};

/**
 * Log error to console with colors and formatting
 */
const logToConsole = (errorDetails: ErrorDetails) => {
  const { timestamp, type, message, stack, statusCode, request, context } = errorDetails;

  console.error(
    `${Colors.Gray}[${timestamp}]${Colors.Reset} ` +
    `${Colors.Red}[ERROR]${Colors.Reset} ` +
    (context ? `[${context}] ` : '') +
    `${type}: ${message}\n` +
    `${Colors.Yellow}Status:${Colors.Reset} ${statusCode}\n` +
    (request ? `${Colors.Blue}Request:${Colors.Reset} ${request.method} ${request.url}\n` : '') +
    (stack ? `${Colors.Gray}${stack}${Colors.Reset}\n` : '')
  );
};

/**
 * Send notification via Gotify (to be implemented)
 */
const notifyError = async (errorDetails: ErrorDetails) => {
  // TODO: Implement Gotify integration
  // This will be implemented when Gotify is added
  // Example implementation:
  /*
  if (process.env.GOTIFY_URL && process.env.GOTIFY_TOKEN) {
    try {
      const priority = errorDetails.statusCode >= 500 ? 8 : 5;
      await fetch(`${process.env.GOTIFY_URL}/message`, {
        method: 'POST',
        headers: {
          'X-Gotify-Key': process.env.GOTIFY_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Error: ${errorDetails.type}`,
          message: errorDetails.message,
          priority
        })
      });
    } catch (err) {
      console.error('Failed to send Gotify notification:', err);
    }
  }
  */
};

/**
 * Central error handler for API routes
 * Handles logging, notifications, and client response
 */
export const errorHandler = async (
  err: Error | AppError,
  req: NextApiRequest,
  res: NextApiResponse
) => {
  // Format error details
  const errorDetails = formatError(err, req);

  // Log error
  logToConsole(errorDetails);
  await logToFile(errorDetails);

  // Notify if critical
  if (errorDetails.statusCode >= 500) {
    await notifyError(errorDetails);
  }

  // Send response
  if ((err as AppError).isOperational) {
    // Operational errors: send details to client
    return res.status(errorDetails.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
    });
  }

  // Programming or unknown errors: don't leak details
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred'
  });
};

/**
 * Create an error logger for non-API contexts
 */
export const createErrorLogger = (context: string) => {
  return async (err: Error, metadata?: Record<string, any>) => {
    const errorDetails = formatError(err);
    errorDetails.context = context;
    errorDetails.metadata = { ...errorDetails.metadata, ...metadata };

    logToConsole(errorDetails);
    await logToFile(errorDetails);

    if (errorDetails.statusCode >= 500) {
      await notifyError(errorDetails);
    }
  };
};
