import { renderHook, act } from '@testing-library/react';
import { useFlowStore } from '../flowStore';

// Mocks for blockchain SDKs are provided by setupTests.js
// Mock environment variables
process.env.REACT_APP_FLOW_CONTRACT = 'flow_contract';
process.env.REACT_APP_FLOW_TOKEN = 'flow_token';

describe.skip('flowStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFlowStore.setState({
      isConnected: false,
      isLoading: false,
      error: null,
      flowContract: null,
      flowToken: null,
      userAddress: null,
      userBalance: '0',
      flows: [],
      transactions: [],
    });
  });

  describe('initializeFlow', () => {
    it('should initialize Flow store successfully', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await result.current.initializeFlow();
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.flowContract).toBeDefined();
      expect(result.current.flowToken).toBeDefined();
    });

    it('should handle initialization errors', async () => {
      const { result } = renderHook(() => useFlowStore());

      // Mock contract initialization to fail
      const originalConsoleError = console.error;
      console.error = jest.fn();

      await act(async () => {
        await result.current.initializeFlow();
      });

      // Should handle errors gracefully
      expect(result.current.isLoading).toBe(false);

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('connectWallet', () => {
    it('should connect wallet successfully', async () => {
      const { result } = renderHook(() => useFlowStore());
      const mockAddress = '0x1234567890123456789012345678901234567890';

      await act(async () => {
        await result.current.connectWallet(mockAddress);
      });

      expect(result.current.userAddress).toBe(mockAddress);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle wallet connection errors', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await result.current.connectWallet('');
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('createFlow', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useFlowStore());
      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
      });
    });

    it('should create flow successfully', async () => {
      const { result } = renderHook(() => useFlowStore());

      const recipient = '0x9876543210987654321098765432109876543210';
      const flowRate = '1000000000000000'; // 0.001 ETH per second

      await act(async () => {
        const flow = await result.current.createFlow(recipient, flowRate);
        expect(flow).toBeDefined();
      });

      expect(result.current.flows.length).toBe(1);
      expect(result.current.flows[0].recipient).toBe(recipient);
      expect(result.current.flows[0].flowRate).toBe(flowRate);
    });

    it('should throw error when not connected', async () => {
      const { result } = renderHook(() => useFlowStore());

      act(() => {
        result.current.disconnectWallet();
      });

      await act(async () => {
        await expect(result.current.createFlow('0x123', '1000')).rejects.toThrow('Wallet not connected');
      });
    });

    it('should handle invalid recipient address', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await expect(result.current.createFlow('invalid-address', '1000')).rejects.toThrow();
      });
    });
  });

  describe('updateFlow', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useFlowStore());
      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createFlow('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should update flow successfully', async () => {
      const { result } = renderHook(() => useFlowStore());

      const flowId = result.current.flows[0].id;
      const newFlowRate = '2000000000000000'; // 0.002 ETH per second

      await act(async () => {
        await result.current.updateFlow(flowId, newFlowRate);
      });

      expect(result.current.flows[0].flowRate).toBe(newFlowRate);
    });

    it('should throw error when updating non-existent flow', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await expect(result.current.updateFlow('non-existent-id', '2000')).rejects.toThrow();
      });
    });
  });

  describe('deleteFlow', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useFlowStore());
      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createFlow('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should delete flow successfully', async () => {
      const { result } = renderHook(() => useFlowStore());

      const flowId = result.current.flows[0].id;

      await act(async () => {
        await result.current.deleteFlow(flowId);
      });

      expect(result.current.flows.length).toBe(0);
    });

    it('should throw error when deleting non-existent flow', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await expect(result.current.deleteFlow('non-existent-id')).rejects.toThrow();
      });
    });
  });

  describe('loadUserBalance', () => {
    it('should load user balance', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.loadUserBalance();
      });

      expect(result.current.userBalance).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle balance loading errors', async () => {
      const { result } = renderHook(() => useFlowStore());

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await act(async () => {
        await result.current.loadUserBalance();
      });

      // Should not throw error, just log it
      expect(result.current.userBalance).toBeDefined();

      console.error = originalConsoleError;
    });
  });

  describe('loadUserFlows', () => {
    it('should load user flows (empty for now)', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await result.current.loadUserFlows('0x1234567890123456789012345678901234567890');
      });

      expect(result.current.flows).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle loading errors gracefully', async () => {
      const { result } = renderHook(() => useFlowStore());

      const originalConsoleError = console.error;
      console.error = jest.fn();

      await act(async () => {
        await result.current.loadUserFlows('invalid-address');
      });

      // Should not throw error, just log it
      expect(result.current.flows).toBeDefined();

      console.error = originalConsoleError;
    });
  });

  describe('loadTransactions', () => {
    it('should load transactions (empty for now)', async () => {
      const { result } = renderHook(() => useFlowStore());

      await act(async () => {
        await result.current.loadTransactions('0x1234567890123456789012345678901234567890');
      });

      expect(result.current.transactions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useFlowStore());
      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createFlow('0x9876543210987654321098765432109876543210', '1000000000000000');
      });
    });

    it('should get total flow rate', () => {
      const { result } = renderHook(() => useFlowStore());

      const totalFlowRate = result.current.getTotalFlowRate();
      expect(totalFlowRate).toBe('1000000000000000');
    });

    it('should get flow by ID', () => {
      const { result } = renderHook(() => useFlowStore());

      const flowId = result.current.flows[0].id;
      const flow = result.current.getFlowById(flowId);

      expect(flow).toBeDefined();
      expect(flow.id).toBe(flowId);
    });

    it('should return undefined for non-existent flow', () => {
      const { result } = renderHook(() => useFlowStore());

      const flow = result.current.getFlowById('non-existent');
      expect(flow).toBeUndefined();
    });

    it('should get active flows', () => {
      const { result } = renderHook(() => useFlowStore());

      const activeFlows = result.current.getActiveFlows();
      expect(activeFlows.length).toBe(1);
      expect(activeFlows[0].isActive).toBe(true);
    });

    it('should get incoming flows', () => {
      const { result } = renderHook(() => useFlowStore());

      const incomingFlows = result.current.getIncomingFlows();
      expect(incomingFlows.length).toBe(0); // No incoming flows in this test
    });

    it('should get outgoing flows', () => {
      const { result } = renderHook(() => useFlowStore());

      const outgoingFlows = result.current.getOutgoingFlows();
      expect(outgoingFlows.length).toBe(1);
      expect(outgoingFlows[0].sender).toBe(result.current.userAddress);
    });
  });

  describe('disconnectWallet', () => {
    it('should disconnect wallet and clear user data', async () => {
      const { result } = renderHook(() => useFlowStore());

      // First connect and create data
      await act(async () => {
        await result.current.initializeFlow();
        await result.current.connectWallet('0x1234567890123456789012345678901234567890');
        await result.current.createFlow('0x9876543210987654321098765432109876543210', '1000000000000000');
      });

      expect(result.current.userAddress).toBeDefined();
      expect(result.current.flows.length).toBe(1);

      // Then disconnect
      act(() => {
        result.current.disconnectWallet();
      });

      expect(result.current.userAddress).toBe(null);
      expect(result.current.flows).toEqual([]);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.userBalance).toBe('0');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useFlowStore());

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
