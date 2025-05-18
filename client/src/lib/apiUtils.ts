/**
 * API utilities for common error handling and response processing
 */

import { toast } from '@/hooks/use-toast';

/**
 * Default response transformer for API requests
 * This function applies consistent data transformations to all API responses
 */
export const defaultResponseTransformer = async (response: Response) => {
  if (!response.ok) {
    // Handle different HTTP error codes appropriately
    const errorText = await response.text();
    let errorMessage = 'An error occurred';
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If the error isn't JSON, use the raw text
      errorMessage = errorText || errorMessage;
    }
    
    // Format based on status code
    switch (response.status) {
      case 401:
        throw new Error('Authentication required. Please log in.');
      case 403:
        throw new Error('You do not have permission to access this resource.');
      case 404:
        throw new Error('The requested resource was not found.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(errorMessage);
    }
  }
  
  // Process successful responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};

/**
 * Helper function to handle common API errors
 */
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  // Show a toast notification for the error
  toast({
    title: 'Error',
    description: error.message || 'An unexpected error occurred',
    variant: 'destructive',
  });
  
  return error;
};

/**
 * Mock API data generator for development and handling API failures
 * This provides structured data when APIs fail, allowing UI development to continue
 */
export const generateMockData = (endpoint: string) => {
  // We'll return empty but valid structured data for different endpoints
  // This ensures components don't break when APIs are unavailable
  
  switch (true) {
    case endpoint.includes('/api/courses'):
      return { courses: [] };
    case endpoint.includes('/api/exams'):
      return { exams: [] };
    case endpoint.includes('/api/materials'):
      return { materials: [] };
    case endpoint.includes('/api/progress'):
      return { progress: [] };
    case endpoint.includes('/api/forum/posts'):
      return { posts: [] };
    case endpoint.includes('/api/jobs'):
      return { jobs: [] };
    case endpoint.includes('/api/auth/me'):
      return null; // No user when auth fails
    default:
      return {}; // Generic empty object for unknown endpoints
  }
};