import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import BlockchainService from '../services/BlockchainService';

const useMinting = () => {
  const [blockchainService] = useState(() => new BlockchainService());
  const [walletState, setWalletState] = useState({
    connected: false,
    address: null,
    balance: null,
    blockchain: null
  });
  const [mintingState, setMintingState] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = useCallback(async (blockchain = 'ethereum') => {
    setIsLoading(true);
    try {
      let walletInfo;
      
      switch (blockchain) {
        case 'ethereum':
          walletInfo = await blockchainService.connectEthereumWallet();
          break;
        case 'stellar':
          walletInfo = await blockchainService.connectStellarWallet();
          break;
        default:
          throw new Error('Unsupported blockchain');
      }

      setWalletState({
        connected: true,
        address: walletInfo.address,
        balance: walletInfo.balance,
        blockchain
      });

      toast.success(`${blockchain.charAt(0).toUpperCase() + blockchain.slice(1)} wallet connected!`);
      return walletInfo;
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [blockchainService]);

  const disconnectWallet = useCallback(() => {
    blockchainService.disconnect();
    setWalletState({
      connected: false,
      address: null,
      balance: null,
      blockchain: null
    });
    toast.success('Wallet disconnected');
  }, [blockchainService]);

  const mintArtwork = useCallback(async (artwork, options = {}) => {
    const artworkId = artwork.id;
    
    if (!walletState.connected) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }

    setMintingState(prev => ({
      ...prev,
      [artworkId]: { status: 'pending', progress: 0 }
    }));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMintingState(prev => {
          const current = prev[artworkId]?.progress || 0;
          if (current < 90) {
            return {
              ...prev,
              [artworkId]: { ...prev[artworkId], progress: current + 10 }
            };
          }
          return prev;
        });
      }, 300);

      const result = await blockchainService.mintArtwork(
        artwork,
        walletState.blockchain,
        options.contractConfig
      );

      clearInterval(progressInterval);

      setMintingState(prev => ({
        ...prev,
        [artworkId]: {
          status: 'success',
          progress: 100,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          gasUsed: result.gasUsed
        }
      }));

      toast.success(`Artwork "${artwork.title}" minted successfully!`);
      return result;
    } catch (error) {
      setMintingState(prev => ({
        ...prev,
        [artworkId]: {
          status: 'error',
          progress: 0,
          error: error.message
        }
      }));

      toast.error(`Minting failed: ${error.message}`);
      throw error;
    }
  }, [walletState, blockchainService]);

  const getTransactionStatus = useCallback(async (txHash) => {
    try {
      const status = await blockchainService.getTransactionStatus(
        txHash,
        walletState.blockchain
      );
      return status;
    } catch (error) {
      toast.error(`Failed to get transaction status: ${error.message}`);
      throw error;
    }
  }, [blockchainService, walletState.blockchain]);

  const resetMintingState = useCallback((artworkId) => {
    setMintingState(prev => {
      const newState = { ...prev };
      delete newState[artworkId];
      return newState;
    });
  }, []);

  const getMintingStatus = useCallback((artworkId) => {
    return mintingState[artworkId] || null;
  }, [mintingState]);

  return {
    // Wallet state
    walletState,
    isLoading,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    
    // Minting actions
    mintArtwork,
    getTransactionStatus,
    resetMintingState,
    getMintingStatus,
    
    // Minting state
    mintingState
  };
};

export default useMinting;
