import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useTransactionNotificationStore } from '../store/transactionNotificationStore';
import TransactionStatusIndicator from './ui/TransactionStatusIndicator';

const TransactionNotificationDemo = () => {
  const { 
    addTransaction,
    updateTransactionStatus,
    retryTransaction,
    getPendingTransactions,
    getTransactionsByStatus,
    clearAllNotifications,
    STATUS,
    NOTIFICATION_TYPES
  } = useTransactionNotificationStore();

  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testTransactions, setTestTransactions] = useState([]);

  const simulateTransaction = async (type, scenario = 'success') => {
    const transactionId = addTransaction({
      type,
      details: {
        scenario,
        timestamp: Date.now()
      }
    });

    // Simulate different scenarios
    switch (scenario) {
      case 'success':
        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.PENDING, {
            hash: `test_${transactionId}_hash`
          });
        }, 1000);

        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.CONFIRMED);
        }, 4000);
        break;

      case 'failure':
        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.PENDING, {
            hash: `test_${transactionId}_hash`
          });
        }, 1000);

        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.FAILED, {
            error: 'Simulated transaction failure'
          });
        }, 3000);
        break;

      case 'timeout':
        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.PENDING, {
            hash: `test_${transactionId}_hash`
          });
        }, 1000);

        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.TIMEOUT);
        }, 65000); // After timeout period
        break;

      case 'retry':
        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.PENDING, {
            hash: `test_${transactionId}_hash`
          });
        }, 1000);

        setTimeout(() => {
          updateTransactionStatus(transactionId, STATUS.FAILED, {
            error: 'First attempt failed'
          });
        }, 3000);
        break;
    }

    return transactionId;
  };

  const runTestSuite = async () => {
    setIsTestRunning(true);
    setTestTransactions([]);

    // Test 1: Successful NFT Mint
    const tx1 = await simulateTransaction('NFT Mint', 'success');
    setTestTransactions(prev => [...prev, { id: tx1, type: 'NFT Mint', scenario: 'success' }]);

    // Test 2: Failed NFT Listing
    setTimeout(async () => {
      const tx2 = await simulateTransaction('NFT Listing', 'failure');
      setTestTransactions(prev => [...prev, { id: tx2, type: 'NFT Listing', scenario: 'failure' }]);
    }, 2000);

    // Test 3: Timeout scenario
    setTimeout(async () => {
      const tx3 = await simulateTransaction('NFT Purchase', 'timeout');
      setTestTransactions(prev => [...prev, { id: tx3, type: 'NFT Purchase', scenario: 'timeout' }]);
    }, 4000);

    // Test 4: Retry scenario
    setTimeout(async () => {
      const tx4 = await simulateTransaction('Artwork Evolution', 'retry');
      setTestTransactions(prev => [...prev, { id: tx4, type: 'Artwork Evolution', scenario: 'retry' }]);
    }, 6000);

    setTimeout(() => {
      setIsTestRunning(false);
    }, 8000);
  };

  const handleRetry = async (transactionId) => {
    try {
      await retryTransaction(transactionId);
      
      // Simulate successful retry
      setTimeout(() => {
        updateTransactionStatus(transactionId, STATUS.CONFIRMED);
      }, 3000);
    } catch (error) {
      console.error('Retry failed:', error);
    }
  };

  const pendingTransactions = getPendingTransactions();
  const confirmedTransactions = getTransactionsByStatus(STATUS.CONFIRMED);
  const failedTransactions = getTransactionsByStatus(STATUS.FAILED);
  const timeoutTransactions = getTransactionsByStatus(STATUS.TIMEOUT);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Transaction Notification System Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Test the complete Soroban transaction notification system with various scenarios.
        </p>

        {/* Control Panel */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={runTestSuite}
            disabled={isTestRunning}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Play className="w-5 h-5 mr-2" />
            {isTestRunning ? 'Running Tests...' : 'Run Test Suite'}
          </button>

          <button
            onClick={clearAllNotifications}
            className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Clear All
          </button>
        </div>

        {/* Test Results */}
        {testTransactions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Transactions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testTransactions.map((testTx) => (
                <div key={testTx.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {testTx.type}
                    </span>
                    <TransactionStatusIndicator 
                      transactionId={testTx.id} 
                      size="sm" 
                      showText={false}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Scenario: {testTx.scenario}
                  </div>
                  {testTx.scenario === 'retry' && (
                    <button
                      onClick={() => handleRetry(testTx.id)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <RefreshCw className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingTransactions.length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{confirmedTransactions.length}</p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{failedTransactions.length}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{timeoutTransactions.length}</p>
                <p className="text-sm text-gray-600">Timeout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Scenarios</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <strong>Success:</strong> Transaction goes from Pending → Confirmed</li>
            <li>• <strong>Failure:</strong> Transaction goes from Pending → Failed</li>
            <li>• <strong>Timeout:</strong> Transaction times out after 60 seconds</li>
            <li>• <strong>Retry:</strong> Transaction fails but can be retried up to 3 times</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionNotificationDemo;
