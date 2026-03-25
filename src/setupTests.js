// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder for Node.js test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
// Polyfill ResizeObserver for jsdom (needed by recharts)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
}
// jsdom polyfills for missing browser APIs
Element.prototype.scrollIntoView = jest.fn();
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener: jest.fn(), removeListener: jest.fn() };
};

// Global mock for framer-motion
// NOTE: jest.mock factories cannot reference out-of-scope variables,
// so we use require('react') inside the factory.
jest.mock('framer-motion', () => {
  const mockReact = require('react');

  const createMotionComponent = (tag) => {
    const Component = mockReact.forwardRef(({ children, ...props }, ref) => {
      // Strip framer-motion-specific props
      const {
        initial, animate, exit, transition, variants,
        whileHover, whileTap, whileFocus, whileInView,
        drag, dragConstraints, layout, layoutId,
        onAnimationComplete, onAnimationStart,
        ...validProps
      } = props;
      return mockReact.createElement(tag, { ...validProps, ref }, children);
    });
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  return {
    __esModule: true,
    motion: new Proxy({}, {
      get: (_target, prop) => createMotionComponent(prop),
    }),
    AnimatePresence: ({ children }) => mockReact.createElement(mockReact.Fragment, null, children),
    useScroll: () => ({ scrollYProgress: { on: jest.fn(), get: jest.fn(() => 0) } }),
    useSpring: (val) => val,
    useTransform: () => 0,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useInView: () => [jest.fn(), true],
    useMotionValue: (val) => ({
      get: () => val,
      set: jest.fn(),
      on: jest.fn(),
    }),
  };
});

// Global mock for lucide-react
jest.mock('lucide-react', () => {
  const mockReact = require('react');

  return new Proxy({}, {
    get: (_target, prop) => {
      if (prop === '__esModule') return true;
      const IconComponent = mockReact.forwardRef(({ children, ...props }, ref) =>
        mockReact.createElement('span', { 'data-testid': `${prop}-icon`, ref, ...props }, children)
      );
      IconComponent.displayName = prop;
      return IconComponent;
    },
  });
});

// Global mocks for blockchain SDKs
jest.mock('@drips-network/sdk', () => ({
  __esModule: true,
  createViemReadAdapter: jest.fn(),
  createDripsSdk: jest.fn().mockResolvedValue({
    getStreams: jest.fn().mockResolvedValue([]),
    setStreams: jest.fn().mockResolvedValue({ hash: '0x123' }),
  }),
}), { virtual: true });

jest.mock('@dripsprotocol/sdk', () => ({
  __esModule: true,
  Drips: jest.fn().mockImplementation(() => ({
    createStream: jest.fn(),
    getStreams: jest.fn().mockResolvedValue([]),
    updateStream: jest.fn(),
    deleteStream: jest.fn(),
  })),
}), { virtual: true });

jest.mock('@sorobanrpc', () => ({
  __esModule: true,
  SorobanRpc: jest.fn().mockImplementation(() => ({
    sendTransaction: jest.fn().mockResolvedValue({ hash: '0x123' }),
    getContractData: jest.fn().mockResolvedValue([]),
  })),
}), { virtual: true });

jest.mock('viem', () => ({
  __esModule: true,
  createPublicClient: jest.fn().mockReturnValue({
    getBalance: jest.fn(),
  }),
  http: jest.fn(),
}), { virtual: true });

jest.mock('viem/chains', () => ({
  __esModule: true,
  mainnet: { id: 1 },
  sepolia: { id: 11155111 },
}), { virtual: true });

// Mock @stellar/stellar-sdk with all required properties
jest.mock('@stellar/stellar-sdk', () => ({
  __esModule: true,
  rpc: {
    Server: jest.fn().mockImplementation((url) => ({
      getTransaction: jest.fn().mockResolvedValue({}),
      submitTransaction: jest.fn().mockResolvedValue({ hash: '0x123' }),
    })),
  },
  Horizon: {
    Server: jest.fn().mockImplementation((url) => ({
      accounts: jest.fn().mockReturnValue({
        accountId: jest.fn().mockReturnThis(),
        call: jest.fn().mockResolvedValue({ id: 'test-account' }),
      }),
      loadAccount: jest.fn().mockResolvedValue({ id: 'test-account', sequenceNumber: '1' }),
      operations: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnThis(),
        call: jest.fn().mockResolvedValue({ records: [] }),
      }),
      transactions: jest.fn().mockReturnValue({
        forAccount: jest.fn().mockReturnThis(),
        call: jest.fn().mockResolvedValue({ records: [] }),
      }),
    })),
  },
  Keypair: {
    fromSecret: jest.fn().mockImplementation((secret) => ({
      publicKey: jest.fn().mockReturnValue('G' + secret.slice(0, 55)),
      secret: jest.fn().mockReturnValue(secret),
    })),
    random: jest.fn().mockImplementation(() => ({
      publicKey: jest.fn().mockReturnValue('GRANDOM' + Math.random().toString().slice(2, 50)),
      secret: jest.fn().mockReturnValue('SRANDOM' + Math.random().toString().slice(2, 50)),
    })),
  },
  Networks: {
    PUBLIC_NETWORK_PASSPHRASE: 'Public Global Stellar Network ; September 2015',
    TESTNET_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  },
  Address: jest.fn().mockImplementation((addr) => ({ toString: () => addr })),
  TransactionBuilder: jest.fn().mockImplementation(() => ({
    addOperation: jest.fn().mockReturnThis(),
    setTimeout: jest.fn().mockReturnThis(),
    setNetworkPassphrase: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({ toXDR: jest.fn().mockReturnValue('xdr') }),
  })),
  Operation: {
    invokeHostFunction: jest.fn(),
    invokeContractFunction: jest.fn(),
  },
  Contract: jest.fn().mockImplementation(() => ({
    method: jest.fn().mockReturnValue({
      invoke: jest.fn().mockResolvedValue({}),
    }),
  })),
  xdr: {
    TransactionBuilder: jest.fn(),
  },
}));

// Mock ethers for wallet and other blockchain interactions
jest.mock('ethers', () => ({
  __esModule: true,
  ethers: {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue('0'),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'homestead' }),
      getSigner: jest.fn().mockReturnValue({
        getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
        sendTransaction: jest.fn().mockResolvedValue({ hash: '0x123' }),
        signMessage: jest.fn().mockResolvedValue('0xsig'),
      }),
    })),
    parseEther: jest.fn((value) => BigInt(value * 1e18)),
    formatEther: jest.fn((value) => (Number(value) / 1e18).toString()),
    Contract: jest.fn().mockImplementation(() => ({
      methods: {},
    })),
    Signer: jest.fn(),
  },
  BrowserProvider: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue('0'),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1, name: 'homestead' }),
  })),
  parseEther: jest.fn((value) => BigInt(value * 1e18)),
  formatEther: jest.fn((value) => (Number(value) / 1e18).toString()),
  Contract: jest.fn().mockImplementation(() => ({
    methods: {},
  })),
}));
