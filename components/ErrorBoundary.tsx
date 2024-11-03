"use client"

import React, { ErrorInfo, ReactNode } from 'react'
import {
  Alert,
  AlertTitle,
  Button,
  Paper,
  Typography,
  Box
} from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'

/**
 * Props for the ErrorBoundary component
 * @interface ErrorBoundaryProps
 * @property {ReactNode} children - Child components to be rendered within the error boundary
 */
interface ErrorBoundaryProps {
  children: ReactNode
}

/**
 * State interface for the ErrorBoundary component
 * @interface ErrorBoundaryState
 * @property {boolean} hasError - Flag indicating if an error has occurred
 * @property {Error} [error] - The error object if one was caught
 * @property {ErrorInfo} [errorInfo] - React error info object containing component stack
 */
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * ErrorBoundary Component
 *
 * A React error boundary that catches JavaScript errors anywhere in its child component tree.
 * It logs the errors and displays a fallback UI instead of crashing the whole app.
 *
 * Features:
 * - Catches and logs errors in child components
 * - Displays a user-friendly error message
 * - Shows detailed error information in development mode
 * - Provides options to retry or refresh the page
 * - Integrates with Material UI components
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  /**
   * Static method called when an error is thrown in a child component
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} New state to update the component
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  /**
   * Lifecycle method called after an error has been caught
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - React error info object containing component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with an error reporting service
    console.error("Uncaught error:", error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  /**
   * Handler for resetting the error state
   * Allows users to try the failed action again without refreshing
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            m: 2,
            backgroundColor: 'error.light',
            color: 'error.contrastText'
          }}
        >
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              <Typography variant="h6">
                Something went wrong
              </Typography>
            </AlertTitle>
            <Typography variant="body1">
              An unexpected error occurred while rendering this component.
            </Typography>
          </Alert>

          {/* Show error details in development mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Paper
              sx={{
                p: 2,
                my: 2,
                backgroundColor: 'grey.900',
                color: 'grey.100',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                overflowX: 'auto'
              }}
            >
              <pre>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </Paper>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Box>
        </Paper>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
