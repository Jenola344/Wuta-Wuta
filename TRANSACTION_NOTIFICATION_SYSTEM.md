# Soroban Transaction Notification System

A comprehensive real-time notification system for tracking Soroban transaction status in the Wuta-Wuta NFT marketplace.

## Features

### 🔄 Real-Time Transaction Monitoring
- **Status Tracking**: Pending → Confirmed → Failed → Timeout
- **Automatic Polling**: Every 3 seconds for pending transactions
- **Smart Timeouts**: 60-second timeout with configurable limits
- **Retry Logic**: Up to 3 retry attempts for failed transactions

### 📊 Visual Notifications
- **Toast Notifications**: Non-intrusive status updates
- **Transaction Monitor**: Floating panel showing active transactions
- **Status Indicators**: Color-coded badges with animations
- **Progress Tracking**: Visual progress bars for auto-hiding notifications

### 🎯 Transaction Types Supported
- NFT Minting
- NFT Listing
- NFT Purchase
- Artwork Evolution
- Custom contract calls

## Architecture

### Store Management
```javascript
// Transaction Notification Store
useTransactionNotificationStore
├── addTransaction()     // Add new transaction for tracking
├── updateTransactionStatus() // Update transaction status
├── monitorTransaction() // Start real-time monitoring
├── retryTransaction()   // Retry failed transactions
└── getTransactionsByStatus() // Filter transactions by status
```

### Status Flow
```
Submitted → Pending → Confirmed/Failed/Timeout
     ↓           ↓           ↓
  Notification  Monitoring   Final Status
```

## Components

### 1. TransactionNotificationStore
**Location**: `src/store/transactionNotificationStore.js`

Core state management for all transaction notifications.

**Key Features**:
- Map-based transaction storage for O(1) lookups
- Automatic status polling with cleanup
- Retry mechanism with attempt tracking
- Notification management with auto-hide

**Usage**:
```javascript
const { addTransaction, updateTransactionStatus } = useTransactionNotificationStore();

// Add a new transaction
const transactionId = addTransaction({
  type: 'NFT Mint',
  details: { prompt: 'AI Art', userAddress: '...' }
});

// Update status
updateTransactionStatus(transactionId, STATUS.CONFIRMED);
```

### 2. ToastNotification Component
**Location**: `src/components/ui/ToastNotification.js`

Toast notifications for transaction status updates.

**Features**:
- Auto-hide with progress bar
- Manual dismiss
- Type-specific styling (success, error, warning, info)
- Transaction-specific actions (retry, explorer)

### 3. TransactionStatusIndicator
**Location**: `src/components/ui/TransactionStatusIndicator.js`

Compact status indicator for embedding in other components.

**Props**:
```javascript
<TransactionStatusIndicator 
  transactionId="tx-123"
  size="sm"           // sm, md, lg
  showText={true}     // Show status text
  showActions={false} // Show retry/explorer buttons
/>
```

### 4. TransactionMonitor
**Location**: `src/components/ui/TransactionMonitor.js`

Floating panel showing all active transactions.

**Features**:
- Minimizable interface
- Real-time updates
- Filter by status
- Clear completed transactions

## Integration

### 1. App Component Setup
```javascript
// src/App.js
import NotificationContainer from './components/ui/ToastNotification';
import TransactionMonitor from './components/ui/TransactionMonitor';

const App = ({ children }) => {
  return (
    <>
      {children}
      <NotificationContainer />
      <TransactionMonitor position="bottom-right" maxVisible={3} />
    </>
  );
};
```

### 2. Store Integration
```javascript
// src/store/museStore.js
import { useTransactionNotificationStore } from './transactionNotificationStore';

// In transaction functions:
const notificationStore = useTransactionNotificationStore.getState();
const transactionId = notificationStore.addTransaction({
  type: 'NFT Mint',
  details: { prompt, aiModel, userAddress }
});

// After transaction submission:
notificationStore.updateTransactionStatus(transactionId, STATUS.PENDING, {
  hash: transaction.hash
});
```

### 3. Real-Time Updates
```javascript
// src/components/TransactionHistory.js
const { 
  getPendingTransactions, 
  getTransactionsByStatus 
} = useTransactionNotificationStore();

// Real-time updates with useEffect
useEffect(() => {
  const interval = setInterval(() => {
    updateTransactionsWithRealTimeData();
  }, 3000);
  return () => clearInterval(interval);
}, [showRealTime]);
```

## Configuration

### Environment Variables
```javascript
// Transaction timeout (milliseconds)
const TIMEOUT_MS = 60000;

// Polling interval (milliseconds)
const POLLING_INTERVAL = 3000;

// Maximum retry attempts
const MAX_RETRIES = 3;
```

### Customization
```javascript
// Custom notification types
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success', 
  WARNING: 'warning',
  ERROR: 'error'
};

// Custom status colors
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'text-blue-600 bg-blue-100';
    case 'confirmed': return 'text-green-600 bg-green-100';
    case 'failed': return 'text-red-600 bg-red-100';
    case 'timeout': return 'text-yellow-600 bg-yellow-100';
  }
};
```

## Testing

### Demo Component
**Location**: `src/components/TransactionNotificationDemo.js`

Interactive demo for testing all notification scenarios.

**Test Scenarios**:
1. **Success Flow**: Pending → Confirmed
2. **Failure Flow**: Pending → Failed  
3. **Timeout Flow**: Pending → Timeout
4. **Retry Flow**: Failed → Retry → Confirmed

### Running Tests
```javascript
// Start demo
npm run dev
// Navigate to demo component
// Click "Run Test Suite" to see all scenarios
```

## Best Practices

### 1. Transaction ID Generation
```javascript
// Use unique, descriptive IDs
const transactionId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 2. Error Handling
```javascript
try {
  const result = await stellarClient.sendTransaction(tx);
  notificationStore.updateTransactionStatus(transactionId, STATUS.PENDING, {
    hash: result.hash
  });
} catch (error) {
  notificationStore.updateTransactionStatus(transactionId, STATUS.FAILED, {
    error: error.message
  });
}
```

### 3. Cleanup
```javascript
// Clear completed transactions periodically
useEffect(() => {
  const interval = setInterval(() => {
    clearCompletedTransactions();
  }, 5 * 60 * 1000); // Every 5 minutes
  return () => clearInterval(interval);
}, []);
```

## Troubleshooting

### Common Issues

1. **Transactions not updating**
   - Check Horizon server connection
   - Verify transaction hash format
   - Ensure polling interval is active

2. **Notifications not showing**
   - Verify NotificationContainer is mounted
   - Check transaction store integration
   - Ensure proper status transitions

3. **Memory leaks**
   - Clear completed transactions
   - Clean up intervals on unmount
   - Remove old notifications

### Debug Mode
```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Transaction status updated:', transactionId, status);
}
```

## Future Enhancements

- [ ] WebSocket integration for real-time updates
- [ ] Transaction batching support
- [ ] Advanced filtering and search
- [ ] Transaction analytics dashboard
- [ ] Mobile push notifications
- [ ] Multi-network support

## Dependencies

- **Zustand**: State management
- **Framer Motion**: Animations
- **Lucide React**: Icons
- **Stellar SDK**: Blockchain integration

## License

MIT License - see LICENSE file for details.
