import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Send,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  Grid,
  List,
  Filter,
  Search,
  Sparkles,
  Zap,
  Settings,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../lib/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../lib/Card';
import GlassCard from './ui/GlassCard';
import ProgressIndicator from './ui/ProgressIndicator';
import TransactionMonitor from './TransactionMonitor';
import useMinting from '../hooks/useMinting';
import toast from 'react-hot-toast';

const MintingDashboard = () => {
  const [artworks, setArtworks] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [showProgress, setShowProgress] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const {
    walletState,
    isLoading: walletLoading,
    connectWallet,
    disconnectWallet,
    mintArtwork,
    getMintingStatus,
    resetMintingState
  } = useMinting();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArtworks();
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
  }, []);

  const loadArtworks = async () => {
    try {
      // Mock data - replace with actual API call
      const mockArtworks = [
        {
          id: 1,
          title: "Cosmic Dreams",
          image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23grad)' /%3E%3C/svg%3E",
          status: "ready",
          createdAt: "2024-03-27T10:00:00Z",
          description: "An ethereal journey through space and consciousness"
        },
        {
          id: 2,
          title: "Digital Flora",
          image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f093fb;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23f5576c;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='200' cy='200' r='150' fill='url(%23grad2)' /%3E%3C/svg%3E",
          status: "minted",
          createdAt: "2024-03-26T15:30:00Z",
          description: "Nature reimagined through algorithmic beauty"
        }
      ];
      setArtworks(mockArtworks);
    } catch (error) {
      toast.error('Failed to load artworks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      await connectWallet(selectedBlockchain);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const handleMint = async (artwork) => {
    setShowProgress(true);
    try {
      const result = await mintArtwork(artwork, {
        contractConfig: {
          contractAddress: '0x1234567890123456789012345678901234567890', // Mock contract
        }
      });

      setActiveTransaction(result);

      // Update artwork status
      setArtworks(prev => prev.map(art =>
        art.id === artwork.id ? { ...art, status: 'minted' } : art
      ));
    } catch (error) {
      console.error('Minting failed:', error);
    } finally {
      setShowProgress(false);
    }
  };

  const filteredArtworks = artworks.filter(art => {
    const matchesFilter = filterStatus === 'all' || art.status === filterStatus;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'minted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'minted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Minting Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and mint your AI-generated artwork to the blockchain
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                icon={Settings}
                variant="ghost"
                size="sm"
              />
              <Button
                onClick={walletState.connected ? disconnectWallet : handleConnectWallet}
                icon={Wallet}
                variant={walletState.connected ? "secondary" : "primary"}
                loading={walletLoading}
              >
                {walletState.connected ? `Connected (${walletState.address?.slice(0, 6)}...)` : "Connect Wallet"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <AnimatePresence>
          {showProgress && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <GlassCard intensity="light" className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Minting Progress
                </h3>
                <ProgressIndicator
                  steps={[
                    { label: 'Validate' },
                    { label: 'Upload to IPFS' },
                    { label: 'Create Transaction' },
                    { label: 'Confirm on Blockchain' }
                  ]}
                  currentStep={2}
                  size="md"
                />
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card glass>
            <CardContent className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search artworks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="ready">Ready to Mint</option>
                  <option value="minted">Minted</option>
                  <option value="pending">Pending</option>
                </select>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Artworks Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {filteredArtworks.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No artworks found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your filters or search query'
                    : 'Start by creating some AI-generated artwork'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              <AnimatePresence>
                {filteredArtworks.map((artwork) => (
                  <motion.div
                    key={artwork.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    whileHover={reducedMotion ? {} : { y: -4 }}
                    role="article"
                    aria-label={`Artwork: ${artwork.title}, Status: ${artwork.status}`}
                  >
                    <Card glass className="overflow-hidden group">
                      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={artwork.image}
                          alt={artwork.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(artwork.status)}`}
                            role="status"
                            aria-label={`Status: ${artwork.status}`}
                          >
                            {getStatusIcon(artwork.status)}
                            {artwork.status}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <CardContent className="p-4">
                        <CardTitle className="mb-2">{artwork.title}</CardTitle>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {artwork.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                          Created: {new Date(artwork.createdAt).toLocaleDateString()}
                        </p>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        <Button
                          onClick={() => handleMint(artwork)}
                          disabled={artwork.status === 'minted' || getMintingStatus(artwork.id)?.status === 'pending'}
                          loading={getMintingStatus(artwork.id)?.status === 'pending'}
                          icon={getMintingStatus(artwork.id)?.status === 'pending' ? undefined : Send}
                          className="w-full"
                          variant={artwork.status === 'minted' ? 'secondary' : 'primary'}
                          aria-label={`Mint ${artwork.title} to blockchain`}
                          aria-describedby={`mint-status-${artwork.id}`}
                        >
                          {artwork.status === 'minted' ? 'Already Minted' :
                            getMintingStatus(artwork.id)?.status === 'pending' ? 'Minting...' : 'Mint to Blockchain'}
                        </Button>
                        <div
                          id={`mint-status-${artwork.id}`}
                          className="sr-only"
                          aria-live="polite"
                          aria-atomic="true"
                        >
                          {getMintingStatus(artwork.id)?.status === 'pending' && `Currently minting ${artwork.title}`}
                          {getMintingStatus(artwork.id)?.status === 'success' && `${artwork.title} has been successfully minted`}
                          {getMintingStatus(artwork.id)?.status === 'error' && `Failed to mint ${artwork.title}`}
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Blockchain Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Blockchain
                  </label>
                  <select
                    value={selectedBlockchain}
                    onChange={(e) => setSelectedBlockchain(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="ethereum">Ethereum (Sepolia Testnet)</option>
                    <option value="stellar">Stellar (Testnet)</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Contract Configuration
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>Contract: 0x1234...5678</p>
                    <p>Network: {selectedBlockchain === 'ethereum' ? 'Sepolia' : 'Stellar Testnet'}</p>
                    <p>Gas: Variable</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Monitor */}
      {activeTransaction && (
        <TransactionMonitor
          transaction={activeTransaction}
          blockchain={selectedBlockchain}
          onClose={() => setActiveTransaction(null)}
        />
      )}
    </div>
  );
};

export default MintingDashboard;
