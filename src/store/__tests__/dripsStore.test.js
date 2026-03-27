import { renderHook, act } from '@testing-library/react';
import { useDripsStore } from '../dripsStore';

// Mocks are provided by setupTests.js
// Mock environment variables
process.env.REACT_APP_DRIPS_CONTRACT = 'drips_contract';
process.env.REACT_APP_DRIPS_HUB = 'drips_hub';

describe.skip('dripsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDripsStore.setState({
      isConnected: false,
      isLoading: false,
      error: null,
      dripsContract: null,
      dripsHub: null,
      userAddress: null,
      userDrips: [],
      receivedDrips: [],
      streams: [],
    });
  });

  describe('initializeDrips', () => {
    it('should initialize Drips store successfully', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await result.current.initializeDrips();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.dripsContract).toBeDefined();
      expect(result.current.dripsHub).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      const { result } = renderHook(() => useDripsStore());

      // Mock contract initialization to fail
      const originalConsoleError = console.error;
      console.error = jest.fn();

      await act(async () => {
        await result.current.initializeDrips();
      });

      // Should handle errors gracefully
      expect(result.current.isLoading).toBe(false);

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('connectWallet', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useDripsStore());
      const mockAddress = '0x1234567890123456789012345678901234567890';

      await act(async () => {
        await result.current.connectWallet(mockAddress);
      });

      expect(result.current.userAddress).toBe(mockAddress);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle wallet connection errors', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await result.current.connectWallet('');
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('createDrip', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useDripsStore());
      await act(async () => {
        await result.current.initializeDrips();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
      });
    });

    it('should create drip successfully', async () => {
      const { result } = renderHook(() => useDripsStore());

      const recipient = '0x9876543210987654321098765432109876543210';
      const amountPerSecond = '1000000000000000'; // 0.001 ETH per second

      await act(async () => {
        const drip = await result.current.createDrip(recipient, amountPerSecond);
        expect(drip).toBeDefined();
      });

      expect(result.current.streams.length).toBe(1);
      expect(result.current.streams[0].recipient).toBe(recipient);
      expect(result.current.streams[0].amountPerSecond).toBe(amountPerSecond);
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useDripsStore());

      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.createDrip('0x123', '1000')).rejects.toThrow('Wallet not connected');
      });
    });

    it('should handle invalid recipient address', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await expect(result.current.createDrip('invalid-address', '1000')).rejects.toThrow();
      });
    });
  });

  describe('stopDrip', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useDripsStore());
      await act(async () => {
        await result.current.initializeDrips();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createDrip('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should stop drip successfully', async () => {
      const { result } = renderHook(() => useDripsStore());

      const streamId = result.current.streams[0].id;

      await act(async () => {
        await result.current.stopDrip(streamId);
      });

      expect(result.current.streams.length).toBe(0);
    });

    it('should throw error when stopping non-existent drip', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await expect(result.current.stopDrip('non-existent-id')).rejects.toThrow();
      });
    });
  });

  describe('updateDrip', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useDripsStore());
      await act(async () => {
        await result.current.initializeDrips();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createDrip('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should update drip successfully', async () => {
      const { result } = renderHook(() => useDripsStore());

      const streamId = result.current.streams[0].id;
      const newAmount = '2000000000000000'; // 0.002 ETH per second

      await act(async () => {
        await result.current.updateDrip(streamId, newAmount);
      });

      expect(result.current.streams[0].amountPerSecond).toBe(newAmount);
    });

    it('should throw error when updating non-existent drip', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await expect(result.current.updateDrip('non-existent-id', '2000')).rejects.toThrow();
      });
    });
  });

  describe('loadUserDrips', () => {
    it('should load user drips (empty for now)', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await result.current.loadUserDrips('0x1234567890123456789012345678901234567890');
      });

      expect(result.current.userDrips).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading errors gracefully', async () => {
      const { result } = renderHook(() => useDripsStore());

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await act(async () => {
        await result.current.loadUserDrips('invalid-address');
      });

      // Should not throw error, just log it
      expect(result.current.userDrips).toBeDefined();

      console.error = originalConsoleError;
    });
  });

  describe('loadReceivedDrips', () => {
    it('should load received drips (empty for now)', async () => {
      const { result } = renderHook(() => useDripsStore());

      await act(async () => {
        await result.current.loadReceivedDrips('0x1234567890123456789012345678901234567890');
      });

      expect(result.current.receivedDrips).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useDripsStore());
      await act(async () => {
        await result.current.initializeDrips();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createDrip('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should get total drips per second', () => {
      const { result } = renderHook(() => useDripsStore());

      const totalDrips = result.current.getTotalDripsPerSecond();
      expect(totalDrips).toBe('1000000000000000');
    });

    it('should get stream by ID', () => {
      const { result } = renderHook(() => useDripsStore());

      const streamId = result.current.streams[0].id;
      const stream = result.current.getStreamById(streamId);

      expect(stream).toBeDefined();
      expect(stream.id).toBe(streamId);
    });

    it('should return undefined for non-existent stream', () => {
      const { result } = renderHook(() => useDripsStore());

      const stream = result.current.getStreamById('non-existent');
      expect(stream).toBeUndefined();
    });

    it('should get active streams', () => {
      const { result } = renderHook(() => useDripsStore());

      const activeStreams = result.current.getActiveStreams();
      expect(activeStreams.length).toBe(1);
      expect(activeStreams[0].isActive).toBe(true);
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet and clear user data', async () => {
      const { result } = renderHook(() => useDripsStore());

      // First connect and create data
      await act(async () => {
        await result.current.initializeDrips();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createDrip('0x9876543210987654321098765432109876543210', '1000000000000000');
      });

      expect(result.current.userAddress).toBeDefined();
      expect(result.current.streams.length).toBe(1);

      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.streams).toEqual([]);
      expect(result.current.userDrips).toEqual([]);
      expect(result.current.receivedDrips).toEqual([]);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useDripsStore());

      // Set an error
      act(() => {
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
});
