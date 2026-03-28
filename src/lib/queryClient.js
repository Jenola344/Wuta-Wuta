import { QueryClient } from '@tanstack/react-query';

// Create a new QueryClient instance with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Data stays in cache indefinitely until garbage collected
      gcTime: Infinity,
      // Refetch on window focus (default behavior)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect unless data is stale
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Don't retry mutations by default (can be overridden per mutation)
      retry: 0,
    },
  },
});

// Custom query defaults for different use cases
export const queryPresets = {
  // For data that changes frequently
  realtime: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // For relatively static data
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: Infinity,
  },
  
  // For user-specific data
  user: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  
  // For blockchain/marketplace data
  blockchain: {
    staleTime: 1000 * 15, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 1000 * 30, // Auto-refetch every 30 seconds
  },
};

export default queryClient;
