import { renderHook, act } from '@testing-library/react';
import { useMuseStore } from '../museStore';

// Mocks for Stellar SDK and SorobanRpc are provided by setupTests.js
// No duplicate mocks needed here

// Mock environment variables
process.env.REACT_APP_ART_ASSET_TOKEN_CONTRACT = 'art_asset_token';
process.env.REACT_APP_NFT_MARKETPLACE_CONTRACT = 'nft_marketplace';

describe.skip('museStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMuseStore.setState({
      isConnected: false,
      isLoading: false,
      error: null,
      stellarClient: null,
      contracts: {
        artAssetToken: null,
        nftMarketplace: null,
      },
      userAddress: null,
      userKeypair: null,
      artworks: [],
      listings: [],
      offers: [],
    });
  });

  describe('initializeMuse', () => {
    it('should initialize Muse store successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      await act(async () => {
        await result.current.initializeMuse();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.stellarClient).toBeDefined();
      expect(result.current.contracts.artAssetToken).toBe('art_asset_token');
      expect(result.current.contracts.nftMarketplace).toBe('nft_marketplace');
    });

    it('should handle initialization errors', async () => {
      const { result } = renderHook(() => useMuseStore());

      // Mock SorobanRpc to throw an error
      const { SorobanRpc } = require('@sorobanrpc');
      SorobanRpc.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await act(async () => {
        await result.current.initializeMuse();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Connection failed');
    });
  });

  describe('connectStellarWallet', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useMuseStore());
      const secretKey = 'S' + 'A'.repeat(55);

      await act(async () => {
        await result.current.connectStellarWallet(secretKey);
      });

      expect(result.current.userAddress).toBeDefined();
      expect(result.current.userKeypair).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle wallet connection errors', async () => {
      const { result } = renderHook(() => useMuseStore());

      // Mock Keypair to throw an error
      const { Keypair } = require('@stellar/stellar-sdk');
      Keypair.fromSecret.mockImplementation(() => {
        throw new Error('Invalid secret key');
      });

      await act(async () => {
        await result.current.connectStellarWallet('invalid-key');
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.userKeypair).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid secret key');
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet and clear user data', async () => {
      const { result } = renderHook(() => useMuseStore());

      // First connect a wallet
      await act(async () => {
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
      });

      expect(result.current.userAddress).toBeDefined();
      expect(result.current.userKeypair).toBeDefined();

      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.userKeypair).toBe(null);
      expect(result.current.artworks).toEqual([]);
    });
  });

  describe('createCollaborativeArtwork', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMuseStore());
      await act(async () => {
        await result.current.initializeMuse();
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
      });
    });

    it('should create collaborative artwork successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      const params = {
        prompt: 'A beautiful landscape',
        aiModel: 'stable-diffusion',
        humanContribution: 60,
        aiContribution: 40,
        canEvolve: true,
        contentHash: '0x1234567890abcdef',
      };

      await act(async () => {
        const artwork = await result.current.createCollaborativeArtwork(params);
        expect(artwork).toBeDefined();
        expect(artwork.metadata.prompt).toBe(params.prompt);
        expect(artwork.metadata.aiModel).toBe(params.aiModel);
        expect(artwork.owner).toBe(result.current.userAddress);
      });

      expect(result.current.artworks.length).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle artwork creation errors', async () => {
      const { result } = renderHook(() => useMuseStore());

      // Mock stellarClient.sendTransaction to throw an error
      const originalSendTransaction = result.current.stellarClient?.sendTransaction;
      if (result.current.stellarClient) {
        result.current.stellarClient.sendTransaction = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      }

      const params = {
        prompt: 'Test artwork',
        aiModel: 'stable-diffusion',
        humanContribution: 50,
        aiContribution: 50,
        canEvolve: true,
      };

      await act(async () => {
        await expect(result.current.createCollaborativeArtwork(params)).rejects.toThrow('Transaction failed');
      });

      expect(result.current.artworks.length).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Transaction failed');
    });

    it('should throw error when not connected to Stellar', async () => {
      const { result } = renderHook(() => useMuseStore());

      // Disconnect first
      act(() => {
        result.current.disconnectWallet();
      });

      const params = {
        prompt: 'Test artwork',
        aiModel: 'stable-diffusion',
        humanContribution: 50,
        aiContribution: 50,
        canEvolve: true,
      };

      await act(async () => {
        await expect(result.current.createCollaborativeArtwork(params)).rejects.toThrow('Not connected to Stellar');
      });
    });
  });

  describe('generateArtwork', () => {
    it('should return correct image URL for stable-diffusion', async () => {
      const { result } = renderHook(() => useMuseStore());

      const params = { aiModel: 'stable-diffusion' };
      const imageUrl = await result.current.generateArtwork(params);

      expect(imageUrl).toBe('https://api.muse.art/generated/stable-diffusion.jpg');
    });

    it('should return correct image URL for dall-e-3', async () => {
      const { result } = renderHook(() => useMuseStore());

      const params = { aiModel: 'dall-e-3' };
      const imageUrl = await result.current.generateArtwork(params);

      expect(imageUrl).toBe('https://api.muse.art/generated/dall-e-3.jpg');
    });

    it('should return default image URL for unknown model', async () => {
      const { result } = renderHook(() => useMuseStore());

      const params = { aiModel: 'unknown-model' };
      const imageUrl = await result.current.generateArtwork(params);

      expect(imageUrl).toBe('https://api.muse.art/generated/stable-diffusion.jpg');
    });
  });

  describe('listArtwork', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMuseStore());
      await act(async () => {
        await result.current.initializeMuse();
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
      });
    });

    it('should list artwork successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      const tokenId = '1';
      const price = '0.5';
      const duration = 86400; // 24 hours

      await act(async () => {
        const listing = await result.current.listArtwork(tokenId, price, duration);
        expect(listing).toBeDefined();
        expect(listing.tokenId).toBe(tokenId);
        expect(listing.price).toBe(price);
        expect(listing.seller).toBe(result.current.userAddress);
      });

      expect(result.current.listings.length).toBe(1);
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useMuseStore());

      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.listArtwork('1', '0.5', 86400)).rejects.toThrow('Not connected to Stellar');
      });
    });
  });

  describe('buyArtwork', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMuseStore());
      await act(async () => {
        await result.current.initializeMuse();
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
        // Add a listing to buy
        await result.current.listArtwork('1', '0.5', 86400);
      });
    });

    it('should buy artwork successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      const tokenId = '1';
      const amount = '0.5';

      await act(async () => {
        const tx = await result.current.buyArtwork(tokenId, amount);
        expect(tx).toBeDefined();
      });

      expect(result.current.listings.length).toBe(0); // Listing should be removed
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useMuseStore());

      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.buyArtwork('1', '0.5')).rejects.toThrow('Not connected to Stellar');
      });
    });
  });

  describe('evolveArtwork', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMuseStore());
      await act(async () => {
        await result.current.initializeMuse();
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
        // Create an artwork to evolve
        await result.current.createCollaborativeArtwork({
          prompt: 'Original artwork',
          aiModel: 'stable-diffusion',
          humanContribution: 60,
          aiContribution: 40,
          canEvolve: true,
        });
      });
    });

    it('should evolve artwork successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      const tokenId = result.current.artworks[0].id;
      const evolutionPrompt = 'Evolved version';

      await act(async () => {
        const evolvedImage = await result.current.evolveArtwork(tokenId, evolutionPrompt);
        expect(evolvedImage).toBeDefined();
        expect(evolvedImage).toContain(tokenId);
        expect(evolvedImage).toContain(evolutionPrompt);
      });

      const evolvedArtwork = result.current.artworks[0];
      expect(evolvedArtwork.evolutionCount).toBe(1);
      expect(evolvedArtwork.lastEvolved).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useMuseStore());

      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.evolveArtwork('1', 'evolution')).rejects.toThrow('Not connected to Stellar');
      });
    });
  });

  describe('generateEvolvedArtwork', () => {
    it('should return correct evolved artwork URL', async () => {
      const { result } = renderHook(() => useMuseStore());

      const tokenId = '123';
      const prompt = 'evolution prompt';

      const evolvedUrl = await result.current.generateEvolvedArtwork(tokenId, prompt);

      expect(evolvedUrl).toBe(`https://api.muse.art/evolved/${tokenId}?prompt=${encodeURIComponent(prompt)}`);
    });
  });

  describe('loadMarketplaceData', () => {
    it('should load marketplace data successfully', async () => {
      const { result } = renderHook(() => useMuseStore());

      await act(async () => {
        await result.current.initializeMuse();
        await result.current.loadMarketplaceData();
      });

      expect(result.current.listings).toBeDefined();
      // Should not throw error even if contract data is empty
    });

    it('should handle loading errors gracefully', async () => {
      const { result } = renderHook(() => useMuseStore());

      // Mock getContractData to throw an error
      const { SorobanRpc } = require('@sorobanrpc');
      SorobanRpc.mockImplementation(() => ({
        getContractData: jest.fn().mockRejectedValue(new Error('Contract error')),
      }));

      await act(async () => {
        await result.current.initializeMuse();
        await result.current.loadMarketplaceData();
      });

      // Should not throw error, just log it
      expect(result.current.listings).toBeDefined();
    });
  });

  describe('loadUserArtworks', () => {
    it('should load user artworks (empty array for now)', async () => {
      const { result } = renderHook(() => useMuseStore());

      await act(async () => {
        await result.current.loadUserArtworks('G' + 'A'.repeat(55));
      });

      expect(result.current.artworks).toEqual([]);
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useMuseStore());
      await act(async () => {
        await result.current.initializeMuse();
        await result.current.connectStellarWallet('S' + 'A'.repeat(55));
        // Create some test data
        await result.current.createCollaborativeArtwork({
          prompt: 'Test artwork',
          aiModel: 'stable-diffusion',
          humanContribution: 50,
          aiContribution: 50,
          canEvolve: true,
        });
        await result.current.listArtwork('1', '0.5', 86400);
      });
    });

    it('should get artwork by ID', () => {
      const { result } = renderHook(() => useMuseStore());

      const artwork = result.current.getArtworkById('1');
      expect(artwork).toBeDefined();
      expect(artwork.metadata.prompt).toBe('Test artwork');
    });

    it('should return undefined for non-existent artwork', () => {
      const { result } = renderHook(() => useMuseStore());

      const artwork = result.current.getArtworkById('999');
      expect(artwork).toBeUndefined();
    });

    it('should get active listings', () => {
      const { result } = renderHook(() => useMuseStore());

      const activeListings = result.current.getActiveListings();
      expect(activeListings.length).toBe(1);
      expect(activeListings[0].active).toBe(true);
    });

    it('should get user listings', () => {
      const { result } = renderHook(() => useMuseStore());

      const userListings = result.current.getUserListings(result.current.userAddress);
      expect(userListings.length).toBe(1);
      expect(userListings[0].seller).toBe(result.current.userAddress);
    });

    it('should return empty array for user with no listings', () => {
      const { result } = renderHook(() => useMuseStore());

      const userListings = result.current.getUserListings('G' + 'B'.repeat(55));
      expect(userListings).toEqual([]);
    });
  });

  describe('AI Models', () => {
    it('should have predefined AI models', () => {
      const { result } = renderHook(() => useMuseStore());

      expect(result.current.aiModels).toHaveLength(4);
      expect(result.current.aiModels[0].id).toBe('stable-diffusion');
      expect(result.current.aiModels[1].id).toBe('dall-e-3');
      expect(result.current.aiModels[2].id).toBe('gpt-4');
      expect(result.current.aiModels[3].id).toBe('midjourney');
    });
  });
});
