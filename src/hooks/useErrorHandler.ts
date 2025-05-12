import { useToast } from '../contexts/ToastContext';

export function useErrorHandler() {
  const { showToast } = useToast();

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('network')) {
        message = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('permission')) {
        message = 'You don\'t have permission to perform this action.';
      } else if (error.message.includes('not found')) {
        message = 'The requested resource was not found.';
      } else if (error.message.includes('timeout')) {
        message = 'The request timed out. Please try again.';
      } else {
        // Use the error message if it's user-friendly
        message = error.message;
      }
    }

    showToast(message, 'error');
    return message;
  };

  return handleError;
}