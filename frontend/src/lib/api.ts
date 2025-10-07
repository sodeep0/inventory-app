import axios, { AxiosError, AxiosRequestConfig } from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token automatically
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          if (userData.token) {
            config.headers.Authorization = `Bearer ${userData.token}`;
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - logout user
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Please try again later.');
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to get error message from axios error
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    
    // Rate limit error
    if (axiosError.response?.status === 429) {
      return 'Too many requests. Please try again in a few minutes.';
    }
    
    // Server error message
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    // Network error
    if (!axiosError.response) {
      return 'Network error. Please check your connection.';
    }
    
    // Generic HTTP error
    return `Error: ${axiosError.response.status} - ${axiosError.response.statusText}`;
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Type-safe API methods
export const apiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    api.get<T>(url, config).then(res => res.data),
  
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    api.post<T>(url, data, config).then(res => res.data),
  
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => 
    api.put<T>(url, data, config).then(res => res.data),
  
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => 
    api.delete<T>(url, config).then(res => res.data),
};

export default api;

