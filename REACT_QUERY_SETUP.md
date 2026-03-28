# React Query Implementation Guide

## Overview

This project now uses **@tanstack/react-query** for efficient data fetching, caching, and state management alongside our Zustand stores.

## Installation

React Query has been installed and configured:

```bash
npm install @tanstack/react-query
```

## Configuration

### QueryClient Setup

The QueryClient is configured in `src/lib/queryClient.js` with optimized defaults:

- **Retry logic**: 3 retries with exponential backoff
- **Stale time**: 5 minutes (configurable per query)
- **Cache time**: Infinite (with garbage collection)
- **Auto-refetch**: On window focus and reconnect

### Provider Setup

The app is wrapped with `QueryClientProvider` in `src/index.js`:

```jsx
<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

## Usage Examples

### 1. Drips Dashboard Data Fetching

**Before** (using only Zustand):
```jsx
import { useDripsStore } from '../store/dripsStore';

function Dashboard() {
  const { stats, isLoading, error } = useDripsStore();
  
  return <div>{/* render stats */}</div>;
}
```

**After** (with React Query integration):
```jsx
import { useDripsDashboard } from '../hooks/useDripsQuery';

function Dashboard() {
  const { data, isLoading, error, refetch } = useDripsDashboard();
  
  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      {/* render data.stats */}
    </div>
  );
}
```

### 2. Flow Wallet Connection

**Using the hook:**
```jsx
import { useFlowWallet, useFlowArtworks } from '../hooks/useFlowQuery';

function MintingDashboard() {
  const { 
    isConnected, 
    isLoading, 
    connect, 
    disconnect 
  } = useFlowWallet();
  
  const { artworks, isLoading: loadingArtworks } = useFlowArtworks();
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={connect} disabled={isLoading}>
          Connect Wallet
        </button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}
      
      {loadingArtworks ? (
        <p>Loading artworks...</p>
      ) : (
        <div>
          {artworks.map(art => <ArtCard key={art.id} {...art} />)}
        </div>
      )}
    </div>
  );
}
```

### 3. Minting Artwork with Mutations

```jsx
import { useMintArtwork, useMintingStatus } from '../hooks/useFlowQuery';

function ArtworkCard({ artwork }) {
  const mintMutation = useMintArtwork();
  const { status: mintingStatus } = useMintingStatus(artwork.id);
  
  const handleMint = async () => {
    try {
      await mintMutation.mutateAsync({
        artwork,
        contractConfig: {
          contractAddress: '0x...'
        }
      });
    } catch (error) {
      console.error('Minting failed:', error);
    }
  };
  
  return (
    <div>
      <h3>{artwork.title}</h3>
      <button 
        onClick={handleMint}
        disabled={mintMutation.isLoading || artwork.status === 'minted'}
      >
        {mintMutation.isLoading ? 'Minting...' : 'Mint'}
      </button>
      
      {mintingStatus?.status === 'pending' && (
        <p>Minting in progress...</p>
      )}
    </div>
  );
}
```

## Query Keys

Query keys are organized hierarchically for easy cache management:

### Drips Query Keys
```javascript
dripsQueryKeys.all                    // ['drips']
dripsQueryKeys.stats()                // ['drips', 'stats']
dripsQueryKeys.activity()             // ['drips', 'activity']
dripsQueryKeys.projects()             // ['drips', 'projects']
dripsQueryKeys.fundingHistory()       // ['drips', 'funding-history']
```

### Flow Query Keys
```javascript
flowQueryKeys.all                     // ['flow']
flowQueryKeys.wallet()                // ['flow', 'wallet']
flowQueryKeys.artworks()              // ['flow', 'artworks']
flowQueryKeys.mintingStatus(id)       // ['flow', 'minting', id]
flowQueryKeys.transactions()          // ['flow', 'transactions']
```

## Cache Invalidation

Manually invalidate queries when needed:

```jsx
import { useQueryClient } from '@tanstack/react-query';
import { dripsQueryKeys } from '../hooks/useDripsQuery';

function RefreshButton() {
  const queryClient = useQueryClient();
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ 
      queryKey: dripsQueryKeys.all 
    });
  };
  
  return <button onClick={handleRefresh}>Refresh</button>;
}
```

## Custom Query Presets

Use predefined presets for common scenarios:

```javascript
import { queryPresets } from '../lib/queryClient';

// Realtime data (updates frequently)
useQuery({
  ...queryPresets.realtime,
  queryKey: ['live-data'],
  queryFn: fetchLiveData
});

// Static data (rarely changes)
useQuery({
  ...queryPresets.static,
  queryKey: ['static-data'],
  queryFn: fetchStaticData
});

// Blockchain data (needs frequent updates)
useQuery({
  ...queryPresets.blockchain,
  queryKey: ['blockchain-data'],
  queryFn: fetchBlockchainData
});
```

## React Query Devtools

The React Query Devtools are included and can be opened by clicking the React Query logo in the bottom-right corner of your screen.

Features:
- View active queries
- Inspect cache data
- Monitor query states
- Debug refetches

## Best Practices

1. **Use hooks**: Always use the custom hooks (`useDripsDashboard`, `useFlowWallet`, etc.) instead of calling stores directly

2. **Leverage caching**: Let React Query handle caching - don't duplicate state in components

3. **Handle loading states**: Always check `isLoading` before rendering data

4. **Error boundaries**: Wrap query-dependent components in error boundaries

5. **Optimistic updates**: Use mutations with `onMutate` for instant UI feedback

6. **Background refetching**: Allow React Query to refetch stale data automatically

## Migration Strategy

Gradually migrate components to use React Query:

1. Start with data-fetching heavy components
2. Replace direct store calls with query hooks
3. Keep Zustand for UI state and ephemeral data
4. Use React Query for server/cache state

## Troubleshooting

### Query not refetching?
- Check `staleTime` configuration
- Verify query keys match exactly
- Use `invalidateQueries` to force refresh

### Too many refetches?
- Increase `staleTime`
- Disable `refetchOnWindowFocus` for specific queries
- Use `enabled: false` to manually control fetching

### Cache not clearing?
- Use `queryClient.clear()` to reset all cache
- Or `removeQueries` for specific keys

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Devtools](https://tanstack.com/query/latest/docs/react/devtools)
- [Query Key Best Practices](https://tanstack.com/query/latest/docs/react/guides/query-keys)
