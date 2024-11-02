import { NextApiRequest, NextApiResponse } from 'next'

export class AppError extends Error {
  statusCode: number
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (err: AppError, req: NextApiRequest, res: NextApiResponse) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Log error
  console.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`)

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    })
  }

  // Programming or other unknown error: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!'
  })
}
