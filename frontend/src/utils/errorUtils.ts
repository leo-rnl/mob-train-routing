import axios from 'axios'

interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string
    }
  }
}

function hasResponseMessage(error: unknown): error is ErrorWithResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ErrorWithResponse).response?.data?.message === 'string'
  )
}

/**
 * Extract error message from an API error response
 * @param error - The caught error (usually from catch block)
 * @param defaultMessage - Fallback message if no API message is found
 * @returns The error message string
 */
export function getApiErrorMessage(error: unknown, defaultMessage: string): string {
  // First try axios.isAxiosError for real Axios errors
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? defaultMessage
  }
  // Fallback for error-like objects (useful in tests)
  if (hasResponseMessage(error)) {
    return error.response?.data?.message ?? defaultMessage
  }
  return defaultMessage
}
