import { create } from 'zustand';
import { ethers } from 'ethers';

const useFlowStore = create((set, get) => ({
  // State
  isConnected: false,
  isLoading: false,
  error: null,
  provider: null,
  signer: null,
  chainId: null,
  artworks: [],
  mintingStatus: {},
  transactions: [],

  // Actions
  connectWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      set({ 
        provider, 
        signer,
        chainId,
        isConnected: true, 
        isLoading: false,
        error: null
      });
      
      // Save connection to localStorage
      localStorage.setItem('flowWalletConnected', 'true');
      localStorage.setItem('flowAddress', accounts[0]);
      
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ 
        error: error.message, 
        isLoading: false,
        isConnected: false
      });
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      provider: null,
      signer: null,
      chainId: null,
      artworks: [],
      mintingStatus: {},
      transactions: [],
      error: null,
    });
    localStorage.removeItem('flowWalletConnected');
    localStorage.removeItem('flowAddress');
  },

  checkConnection: async () => {
    try {
      const savedConnection = localStorage.getItem('flowWalletConnected');
      const savedAddress = localStorage.getItem('flowAddress');
      
      if (savedConnection === 'true' && savedAddress && typeof window.ethereum !== 'undefined') {
        // Reconnect silently
        await get().connectWallet();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Check connection error:', error);
      return false;
    }
  },

  loadArtworks: async () => {
    try {
      set({ isLoading: true });
      
      // Mock data - replace with actual blockchain queries
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
      
      set({
        artworks: mockArtworks,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Failed to load artworks:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  mintArtwork: async (artwork, contractConfig) => {
    try {
      const { signer, chainId } = get();
      if (!signer) throw new Error('Wallet not connected');
      if (!contractConfig?.contractAddress) throw new Error('Contract address required');

      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { status: 'pending', step: 1, totalSteps: 4 }
        }
      }));

      // Step 1: Validate metadata
      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { ...state.mintingStatus[artwork.id], step: 2 }
        }
      }));

      // Step 2: Upload to IPFS (mock)
      await new Promise(resolve => setTimeout(resolve, 1000));
      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { ...state.mintingStatus[artwork.id], step: 3 }
        }
      }));

      // Step 3: Create transaction
      const tx = {
        hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        from: await signer.getAddress(),
        to: contractConfig.contractAddress,
        value: ethers.parseEther('0.01'),
        timestamp: Date.now()
      };

      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { ...state.mintingStatus[artwork.id], step: 4 }
        },
        transactions: [...state.transactions, tx]
      }));

      // Step 4: Confirm on blockchain (mock)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { status: 'success', txHash: tx.hash }
        },
        artworks: state.artworks.map(art => 
          art.id === artwork.id ? { ...art, status: 'minted' } : art
        )
      }));

      return { success: true, txHash: tx.hash };
      
    } catch (error) {
      console.error('Minting failed:', error);
      set(state => ({
        mintingStatus: {
          ...state.mintingStatus,
          [artwork.id]: { status: 'error', error: error.message }
        }
      }));
      throw error;
    }
  },

  getMintingStatus: (artworkId) => {
    const { mintingStatus } = get();
    return mintingStatus[artworkId] || null;
  },

  resetMintingState: (artworkId) => {
    set(state => ({
      mintingStatus: {
        ...state.mintingStatus,
        [artworkId]: undefined
      }
    }));
  },

  switchNetwork: async (targetChainId) => {
    try {
      const { chainId } = get();
      
      if (chainId === targetChainId) return true;

      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to switch network:', error);
      set({ error: error.message });
      return false;
    }
  },

  refreshArtworks: async () => {
    await get().loadArtworks();
  },

  clearError: () => set({ error: null }),
}));

export { useFlowStore };
