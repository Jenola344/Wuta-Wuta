import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Globe
} from 'lucide-react';
import Button from '../lib/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../lib/Card';
import toast from 'react-hot-toast';

const TransactionMonitor = ({ transaction, blockchain = 'ethereum', onClose }) => {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState('pending');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (transaction?.status) {
      setStatus(transaction.status);
    }
  }, [transaction]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success': return 'Transaction Confirmed';
      case 'failed': return 'Transaction Failed';
      default: return 'Transaction Pending';
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const getExplorerUrl = () => {
    if (!transaction?.transactionHash) return '#';
    
    const baseUrl = blockchain === 'ethereum' 
      ? 'https://sepolia.etherscan.io/tx' // Testnet
      : 'https://stellar.expert/explorer/testnet/tx'; // Testnet
    
    return `${baseUrl}/${transaction.transactionHash}`;
  };

  if (!transaction) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50 max-w-md"
    >
      <Card glass className="shadow-2xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <h4 className={`font-semibold ${getStatusColor()}`}>
                  {getStatusText()}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)} Network
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            )}
          </div>

          {transaction.transactionHash && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {transaction.transactionHash.slice(0, 10)}...
                  {transaction.transactionHash.slice(-8)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(transaction.transactionHash)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    {copied ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                  </a>
                </div>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? 'Hide' : 'Show'} Details
              </button>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {transaction.blockNumber && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Block:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {transaction.blockNumber}
                        </span>
                      </div>
                    )}
                    
                    {transaction.gasUsed && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Gas Used:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {transaction.gasUsed}
                        </span>
                      </div>
                    )}

                    {transaction.fee_paid && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Fee Paid:</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {transaction.fee_paid} lumens
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Network:</span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {blockchain === 'ethereum' ? 'Ethereum Sepolia' : 'Stellar Testnet'}
                        </span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {status === 'pending' && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>Processing transaction...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TransactionMonitor;
