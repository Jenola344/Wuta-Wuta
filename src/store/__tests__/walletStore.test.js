import { renderHook, act } from '@testing-library/react';
import { useWalletStore } from '../walletStore';

// Mock ethers and blockchain SDKs are provided by setupTests.js
// No duplicate mocks needed here

// Mock window.ethereum
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
});

describe.skip('walletStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useWalletStore.setState({
      isConnecting: false,
      isConnected: false,
      address: null,
      provider: null,
      signer: null,
      balance: null,
      chainId: null,
      error: null,
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Default successful mocks
    mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890']);
    mockSigner.getAddress.mockResolvedValue('0x1234567890123456789012345678901234567890');
    mockProvider.getBalance.mockResolvedValue('1000000000000000000'); // 1 ETH
    mockProvider.getNetwork.mockResolvedValue({ chainId: 1 });
    mockSigner.sendTransaction.mockResolvedValue({ hash: '0xabc123' });
    mockSigner.signMessage.mockResolvedValue('0xsignature123');
  });

  describe('connectWallet', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
      expect(result.current.provider).toBe(mockProvider);
      expect(result.current.signer).toBe(mockSigner);
      expect(result.current.balance).toBe('1000000000000000000');
      expect(result.current.chainId).toBe(1);
      expect(result.current.error).toBe(null);

      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
      expect(mockEthers.BrowserProvider).toHaveBeenCalledWith(mockEthereum);
      expect(mockEthereum.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));
      expect(mockEthereum.on).toHaveBeenCalledWith('chainChanged', expect.any(Function));
    });

    it('should handle MetaMask not installed', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Mock no ethereum
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('MetaMask is not installed. Please install MetaMask to continue.');
    });

    it('should handle account request rejection', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockEthereum.request.mockRejectedValue(new Error('User rejected account request'));

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('User rejected account request');
    });

    it('should handle provider errors', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockEthers.BrowserProvider.mockImplementation(() => {
        throw new Error('Provider error');
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBe('Provider error');
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet and clear all data', async () => {
      const { result } = renderHook(() => useWalletStore());

      // First connect
      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnected).toBe(true);

      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.address).toBe(null);
      expect(result.current.provider).toBe(null);
      expect(result.current.signer).toBe(null);
      expect(result.current.balance).toBe(null);
      expect(result.current.chainId).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  describe('updateAccount', () => {
    it('should update account successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      // First connect to set up provider
      await act(async () => {
        await result.current.connectWallet();
      });

      const newAddress = '0x9876543210987654321098765432109876543210';
      const newBalance = '2000000000000000000'; // 2 ETH

      mockSigner.getAddress.mockResolvedValue(newAddress);
      mockProvider.getBalance.mockResolvedValue(newBalance);

      await act(async () => {
        await result.current.updateAccount(newAddress);
      });

      expect(result.current.address).toBe(newAddress);
      expect(result.current.balance).toBe(newBalance);
      expect(result.current.signer).toBe(mockSigner);
    });

    it('should handle update when provider is not available', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Don't connect first, so provider is null
      await act(async () => {
        await result.current.updateAccount('0x1234567890123456789012345678901234567890');
      });

      // Should not throw error, just return early
      expect(result.current.address).toBe(null);
    });

    it('should handle update errors gracefully', async () => {
      const { result } = renderHook(() => useWalletStore());

      // First connect
      await act(async () => {
        await result.current.connectWallet();
      });

      mockProvider.getBalance.mockRejectedValue(new Error('Balance error'));

      await act(async () => {
        await result.current.updateAccount('0x1234567890123456789012345678901234567890');
      });

      // Should not throw error, just log it
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('sendTransaction', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useWalletStore());
      await act(async () => {
        await result.current.connectWallet();
      });
    });

    it('should send transaction successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      const to = '0x9876543210987654321098765432109876543210';
      const value = '0.5';

      await act(async () => {
        const tx = await result.current.sendTransaction(to, value);
        expect(tx).toBeDefined();
        expect(tx.hash).toBe('0xabc123');
      });

      expect(mockSigner.sendTransaction).toHaveBeenCalledWith({
        to,
        value: '0.5 parsed',
      });
    });

    it('should throw error when wallet not connected', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Disconnect first
      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.sendTransaction('0x123', '0.1')).rejects.toThrow('Wallet not connected');
      });
    });

    it('should handle transaction errors', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockSigner.sendTransaction.mockRejectedValue(new Error('Transaction failed'));

      await act(async () => {
        await expect(result.current.sendTransaction('0x123', '0.1')).rejects.toThrow('Transaction failed');
      });
    });
  });

  describe('switchNetwork', () => {
    it('should switch network successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      const chainId = 137; // Polygon

      await act(async () => {
        await result.current.switchNetwork(chainId);
      });

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }],
      });
    });

    it('should handle network switch errors', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockEthereum.request.mockRejectedValue(new Error('Network switch failed'));

      await act(async () => {
        await expect(result.current.switchNetwork(137)).rejects.toThrow('Network switch failed');
      });
    });
  });

  describe('addNetwork', () => {
    it('should add network successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      const networkConfig = {
        chainId: '0x89',
        chainName: 'Polygon',
        rpcUrls: ['https://polygon-rpc.com/'],
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
      };

      await act(async () => {
        await result.current.addNetwork(networkConfig);
      });

      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    });

    it('should handle add network errors', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockEthereum.request.mockRejectedValue(new Error('Add network failed'));

      await act(async () => {
        await expect(result.current.addNetwork({})).rejects.toThrow('Add network failed');
      });
    });
  });

  describe('signMessage', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useWalletStore());
      await act(async () => {
        await result.current.connectWallet();
      });
    });

    it('should sign message successfully', async () => {
      const { result } = renderHook(() => useWalletStore());

      const message = 'Hello, world!';

      await act(async () => {
        const signature = await result.current.signMessage(message);
        expect(signature).toBe('0xsignature123');
      });

      expect(mockSigner.signMessage).toHaveBeenCalledWith(message);
    });

    it('should throw error when wallet not connected', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Disconnect first
      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.signMessage('test')).rejects.toThrow('Wallet not connected');
      });
    });

    it('should handle sign message errors', async () => {
      const { result } = renderHook(() => useWalletStore());

      mockSigner.signMessage.mockRejectedValue(new Error('Sign failed'));

      await act(async () => {
        await expect(result.current.signMessage('test')).rejects.toThrow('Sign failed');
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Set an error
      act(() => {
        result.current.disconnectWallet();
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('event listeners', () => {
    it('should handle accounts changed - empty array', async () => {
      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.isConnected).toBe(true);

      // Simulate accounts changed event with empty array
      const accountsChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];

      if (accountsChangedCallback) {
        await act(async () => {
          accountsChangedCallback([]);
        });
      }

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle accounts changed - new account', async () => {
      const { result } = renderHook(() => useWalletStore());

      await act(async () => {
        await result.current.connectWallet();
      });

      const originalAddress = result.current.address;

      // Simulate accounts changed event with new account
      const accountsChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'accountsChanged'
      )?.[1];

      if (accountsChangedCallback) {
        const newAddress = '0x9876543210987654321098765432109876543210';
        mockSigner.getAddress.mockResolvedValue(newAddress);

        await act(async () => {
          accountsChangedCallback([newAddress]);
        });
      }

      expect(result.current.address).not.toBe(originalAddress);
    });

    it('should handle chain changed', async () => {
      const { result } = renderHook(() => useWalletStore());

      // Mock window.location.reload
      const originalReload = window.location.reload;
      window.location.reload = jest.fn();

      await act(async () => {
        await result.current.connectWallet();
      });

      // Simulate chain changed event
      const chainChangedCallback = mockEthereum.on.mock.calls.find(
        call => call[0] === 'chainChanged'
      )?.[1];

      if (chainChangedCallback) {
        await act(async () => {
          chainChangedCallback();
        });
      }

      expect(window.location.reload).toHaveBeenCalled();

      // Restore original reload
      window.location.reload = originalReload;
    });
  });

  describe('connection state management', () => {
    it('should set connecting state during connection', async () => {
      const { result } = renderHook(() => useWalletStore());

      let resolveConnection;
      const connectionPromise = new Promise(resolve => {
        resolveConnection = resolve;
      });

      mockEthereum.request.mockImplementation(() => connectionPromise);

      // Start connection
      act(() => {
        result.current.connectWallet();
      });

      expect(result.current.isConnecting).toBe(true);

      // Resolve connection
      await act(async () => {
        resolveConnection(['0x1234567890123456789012345678901234567890']);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isConnected).toBe(true);
    });
  });
});
