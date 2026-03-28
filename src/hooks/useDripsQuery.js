import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDripsStore } from '../store/dripsStore';

// Query keys for caching and invalidation
export const dripsQueryKeys = {
  all: ['drips'],
  stats: () => [...dripsQueryKeys.all, 'stats'],
  activity: () => [...dripsQueryKeys.all, 'activity'],
  projects: () => [...dripsQueryKeys.all, 'projects'],
  fundingHistory: () => [...dripsQueryKeys.all, 'funding-history'],
  contributorMetrics: () => [...dripsQueryKeys.all, 'contributor-metrics'],
};

/**
 * Hook to fetch Drips dashboard data using React Query
 * Integrates with useDripsStore for state management
 */
export function useDripsDashboard() {
  const queryClient = useQueryClient();
  const { initializeDrips, refreshData } = useDripsStore();

  // Fetch dashboard data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dripsQueryKeys.all,
    queryFn: async () => {
      await initializeDrips();
      return refreshData();
    },
    // Use store's configuration
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Invalidate cache to force refetch
  const invalidate = () => {
    return queryClient.invalidateQueries({ queryKey: dripsQueryKeys.all });
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook to subscribe to a project using Drips
 * Uses mutation for write operations
 */
export function useSubscribeToProject() {
  const queryClient = useQueryClient();
  const { subscribeToProject } = useDripsStore();

  return useMutation({
    mutationFn: async ({ projectId, amountPerSecond }) => {
      return await subscribeToProject(projectId, amountPerSecond);
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful subscription
      queryClient.invalidateQueries({ queryKey: dripsQueryKeys.all });
    },
    retry: 2,
  });
}

/**
 * Hook to unsubscribe from a project
 */
export function useUnsubscribeFromProject() {
  const queryClient = useQueryClient();
  const { unsubscribeFromProject } = useDripsStore();

  return useMutation({
    mutationFn: async (projectId) => {
      return await unsubscribeFromProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dripsQueryKeys.all });
    },
    retry: 2,
  });
}

export default {
  useDripsDashboard,
  useSubscribeToProject,
  useUnsubscribeFromProject,
  dripsQueryKeys,
};
