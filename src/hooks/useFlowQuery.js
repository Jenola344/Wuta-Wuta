import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFlowStore } from '../store/flowStore';

// Query keys for caching and invalidation
export const flowQueryKeys = {
  all: ['flow'],
  wallet: () => [...flowQueryKeys.all, 'wallet'],
  artworks: () => [...flowQueryKeys.all, 'artworks'],
  mintingStatus: (artworkId) => [...flowQueryKeys.all, 'minting', artworkId],
  transactions: () => [...flowQueryKeys.all, 'transactions'],
};

/**
 * Hook to manage Flow wallet connection using React Query
 * Integrates with useFlowStore for state management
 */
export function useFlowWallet() {
  const queryClient = useQueryClient();
  const { connectWallet, disconnectWallet, checkConnection } = useFlowStore();

  // Check connection status
  const { data: isConnected, isLoading: isChecking } = useQuery({
    queryKey: flowQueryKeys.wallet(),
    queryFn: async () => {
      return await checkConnection();
    },
    staleTime: Infinity, // Only check once per session
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Connect wallet mutation
  const connectMutation = useMutation({
    mutationFn: connectWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: flowQueryKeys.wallet() });
      queryClient.invalidateQueries({ queryKey: flowQueryKeys.artworks() });
    },
  });

  // Disconnect wallet
  const disconnect = () => {
    disconnectWallet();
    queryClient.setQueryData(flowQueryKeys.wallet(), false);
    queryClient.invalidateQueries({ queryKey: flowQueryKeys.all });
  };

  return {
    isConnected: isConnected || false,
    isChecking,
    isLoading: connectMutation.isLoading,
    error: connectMutation.error,
    connect: connectMutation.mutateAsync,
    disconnect,
  };
}

/**
 * Hook to fetch and manage Flow artworks
 */
export function useFlowArtworks(filters = {}) {
  const { loadArtworks } = useFlowStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: flowQueryKeys.artworks(),
    queryFn: loadArtworks,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => {
      // Apply filters if provided
      if (!filters || Object.keys(filters).length === 0) {
        return data;
      }
      
      let filtered = data || [];
      
      if (filters.status) {
        filtered = filtered.filter(art => art.status === filters.status);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(art => 
          art.title.toLowerCase().includes(searchLower) ||
          art.description.toLowerCase().includes(searchLower)
        );
      }
      
      return filtered;
    },
  });

  return {
    artworks: data || [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to mint artwork on Flow blockchain
 */
export function useMintArtwork() {
  const queryClient = useQueryClient();
  const { mintArtwork } = useFlowStore();

  return useMutation({
    mutationFn: async ({ artwork, contractConfig }) => {
      return await mintArtwork(artwork, contractConfig);
    },
    onSuccess: (data, variables) => {
      // Invalidate artworks to refresh the list
      queryClient.invalidateQueries({ queryKey: flowQueryKeys.artworks() });
      
      // Update specific artwork status
      if (variables.artwork?.id) {
        queryClient.invalidateQueries({ 
          queryKey: flowQueryKeys.mintingStatus(variables.artwork.id)
        });
      }
    },
    retry: 1, // Only retry once for minting
  });
}

/**
 * Hook to get minting status for a specific artwork
 */
export function useMintingStatus(artworkId) {
  const { getMintingStatus } = useFlowStore();

  const { data } = useQuery({
    queryKey: flowQueryKeys.mintingStatus(artworkId),
    queryFn: () => getMintingStatus(artworkId),
    enabled: !!artworkId,
    staleTime: 5000, // 5 seconds
    refetchInterval: 2000, // Check every 2 seconds when pending
    refetchIntervalInBackground: true,
  });

  return {
    status: data,
    isLoading: data?.status === 'pending',
    isSuccess: data?.status === 'success',
    isError: data?.status === 'error',
  };
}

export default {
  useFlowWallet,
  useFlowArtworks,
  useMintArtwork,
  useMintingStatus,
  flowQueryKeys,
};
