import emailjs from '@emailjs/browser';
import { z } from 'zod';

// Environment variables for EmailJS configuration
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

// Validation schema for email data
const emailSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
  type: z.enum(['feedback', 'feature_request']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional()
});

export type EmailData = z.infer<typeof emailSchema>;

interface EmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Sends an email using EmailJS service
 * @param data Email data including sender info and message
 * @returns Promise resolving to email send status
 */
export async function sendEmail(data: EmailData): Promise<EmailResponse> {
  try {
    // Validate input data
    const validatedData = emailSchema.parse(data);

    // Check if EmailJS is configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      throw new Error('EmailJS configuration is missing');
    }

    // Prepare template parameters
    const templateParams = {
      from_name: validatedData.name,
      from_email: validatedData.email,
      message: validatedData.message,
      type: validatedData.type,
      priority: validatedData.priority || 'medium',
      category: validatedData.category || 'general',
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    // Send email with retry logic
    const response = await retryOperation(
      () => emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      ),
      3
    );

    if (response.status === 200) {
      return {
        success: true,
        messageId: response.text
      };
    }

    throw new Error('Failed to send email');
  } catch (error) {
    console.error('Error sending email:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid email data: ' + error.errors.map(e => e.message).join(', ')
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred while sending email'
    };
  }
}

/**
 * Retries an operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise resolving to operation result
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

/**
 * Validates an email address format
 * @param email Email address to validate
 * @returns Boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  try {
    z.string().email().parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats an error message for display
 * @param error Error object or string
 * @returns Formatted error message
 */
export function formatEmailError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}