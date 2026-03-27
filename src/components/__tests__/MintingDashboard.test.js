import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MintingDashboard from '../MintingDashboard';
import useMinting from '../../hooks/useMinting';
import toast from 'react-hot-toast';

// Mock the useMinting hook
jest.mock('../../hooks/useMinting');
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock IntersectionObserver for responsive testing
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for reduced motion testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const mockUseMinting = {
  walletState: {
    connected: false,
    address: null,
    balance: null,
    blockchain: null,
  },
  isLoading: false,
  connectWallet: jest.fn(),
  disconnectWallet: jest.fn(),
  mintArtwork: jest.fn(),
  getMintingStatus: jest.fn(() => null),
  resetMintingState: jest.fn(),
};

describe('MintingDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useMinting.mockReturnValue(mockUseMinting);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MintingDashboard />
      </BrowserRouter>
    );
  };

  describe('Initial Render', () => {
    it('renders the dashboard title and description', () => {
      renderComponent();
      
      expect(screen.getByText('Minting Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Manage and mint your AI-generated artwork/)).toBeInTheDocument();
    });

    it('renders connect wallet button when not connected', () => {
      renderComponent();
      
      const connectButton = screen.getByText('Connect Wallet');
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveAttribute('aria-label');
    });

    it('renders wallet connected state when connected', () => {
      useMinting.mockReturnValue({
        ...mockUseMinting,
        walletState: {
          connected: true,
          address: '0x1234567890123456789012345678901234567890',
          balance: '1.5',
          blockchain: 'ethereum',
        },
      });
      
      renderComponent();
      
      expect(screen.getByText(/Connected \(0x1234...\)/)).toBeInTheDocument();
    });

    it('renders loading state initially', async () => {
      renderComponent();
      
      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Artwork Gallery', () => {
    beforeEach(async () => {
      renderComponent();
      
      // Wait for artworks to load
      await waitFor(() => {
        expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      });
    });

    it('displays artwork cards with correct information', () => {
      expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      expect(screen.getByText('Digital Flora')).toBeInTheDocument();
      expect(screen.getByText(/An ethereal journey/)).toBeInTheDocument();
    });

    it('shows artwork status badges', () => {
      const statusBadges = screen.getAllByRole('status');
      expect(statusBadges.length).toBeGreaterThan(0);
    });

    it('allows switching between grid and list views', () => {
      const gridButton = screen.getByRole('button', { name: /grid/i });
      const listButton = screen.getByRole('button', { name: /list/i });
      
      expect(gridButton).toBeInTheDocument();
      expect(listButton).toBeInTheDocument();
      
      fireEvent.click(listButton);
      // Should switch to list view
    });

    it('filters artworks by status', () => {
      const filterSelect = screen.getByDisplayValue('All Status');
      
      fireEvent.change(filterSelect, { target: { value: 'ready' } });
      
      expect(filterSelect).toHaveValue('ready');
    });

    it('searches artworks by title and description', () => {
      const searchInput = screen.getByPlaceholderText('Search artworks...');
      
      fireEvent.change(searchInput, { target: { value: 'Cosmic' } });
      
      expect(searchInput).toHaveValue('Cosmic');
    });
  });

  describe('Wallet Integration', () => {
    it('calls connectWallet when connect button is clicked', async () => {
      renderComponent();
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(mockUseMinting.connectWallet).toHaveBeenCalledWith('ethereum');
      });
    });

    it('calls disconnectWallet when disconnect button is clicked', async () => {
      useMinting.mockReturnValue({
        ...mockUseMinting,
        walletState: {
          connected: true,
          address: '0x1234567890123456789012345678901234567890',
          balance: '1.5',
          blockchain: 'ethereum',
        },
      });
      
      renderComponent();
      
      const disconnectButton = screen.getByText(/Connected/);
      fireEvent.click(disconnectButton);
      
      await waitFor(() => {
        expect(mockUseMinting.disconnectWallet).toHaveBeenCalled();
      });
    });
  });

  describe('Minting Functionality', () => {
    beforeEach(async () => {
      renderComponent();
      
      // Wait for artworks to load
      await waitFor(() => {
        expect(screen.getByText('Cosmic Dreams')).toBeInTheDocument();
      });
    });

    it('shows mint button for ready artworks', () => {
      const mintButtons = screen.getAllByText('Mint to Blockchain');
      expect(mintButtons.length).toBeGreaterThan(0);
    });

    it('disables mint button for already minted artworks', () => {
      const mintedButtons = screen.getAllByText('Already Minted');
      expect(mintedButtons.length).toBeGreaterThan(0);
    });

    it('calls mintArtwork when mint button is clicked', async () => {
      // Mock successful minting
      mockUseMinting.mintArtwork.mockResolvedValue({
        transactionHash: '0xabc123',
        status: 'success'
      });
      
      const mintButton = screen.getByText('Mint to Blockchain');
      fireEvent.click(mintButton);
      
      await waitFor(() => {
        expect(mockUseMinting.mintArtwork).toHaveBeenCalledWith(
          expect.objectContaining({ id: 1, title: 'Cosmic Dreams' }),
          expect.objectContaining({
            contractConfig: expect.objectContaining({
              contractAddress: '0x1234567890123456789012345678901234567890'
            })
          })
        );
      });
    });

    it('shows loading state during minting', async () => {
      // Mock pending minting status
      mockUseMinting.getMintingStatus.mockReturnValue({ status: 'pending' });
      
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByText('Minting...')).toBeInTheDocument();
      });
    });
  });

  describe('Settings Modal', () => {
    it('opens settings modal when settings button is clicked', async () => {
      renderComponent();
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Blockchain Settings')).toBeInTheDocument();
      });
    });

    it('closes settings modal when close button is clicked', async () => {
      renderComponent();
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Blockchain Settings')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Blockchain Settings')).not.toBeInTheDocument();
      });
    });

    it('allows blockchain selection', async () => {
      renderComponent();
      
      const settingsButton = screen.getByRole('button', { name: /settings/i });
      fireEvent.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Blockchain Settings')).toBeInTheDocument();
      });
      
      const blockchainSelect = screen.getByDisplayValue('Ethereum (Sepolia Testnet)');
      fireEvent.change(blockchainSelect, { target: { value: 'stellar' } });
      
      expect(blockchainSelect).toHaveValue('stellar');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      renderComponent();
      
      await waitFor(() => {
        const artworkCards = screen.getAllByRole('article');
        expect(artworkCards.length).toBeGreaterThan(0);
        
        artworkCards.forEach(card => {
          expect(card).toHaveAttribute('aria-label');
        });
      });
    });

    it('provides screen reader announcements for minting status', async () => {
      renderComponent();
      
      await waitFor(() => {
        const statusAnnouncements = screen.getAllByRole('status', { hidden: true });
        expect(statusAnnouncements.length).toBeGreaterThan(0);
      });
    });

    it('supports keyboard navigation', async () => {
      renderComponent();
      
      await waitFor(() => {
        const mintButton = screen.getByText('Mint to Blockchain');
        mintButton.focus();
        expect(mintButton).toHaveFocus();
      });
    });

    it('respects reduced motion preference', () => {
      // Mock reduced motion
      window.matchMedia.mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      renderComponent();
      
      // Component should render without animations
      expect(screen.getByText('Minting Dashboard')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      
      renderComponent();
      
      // Should render mobile-friendly layout
      expect(screen.getByText('Minting Dashboard')).toBeInTheDocument();
      
      // Change to desktop
      window.innerWidth = 1024;
      fireEvent(window, new Event('resize'));
      
      // Should still render correctly
      expect(screen.getByText('Minting Dashboard')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles wallet connection errors gracefully', async () => {
      mockUseMinting.connectWallet.mockRejectedValue(new Error('Connection failed'));
      
      renderComponent();
      
      const connectButton = screen.getByText('Connect Wallet');
      fireEvent.click(connectButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to connect wallet');
      });
    });

    it('handles minting errors gracefully', async () => {
      mockUseMinting.mintArtwork.mockRejectedValue(new Error('Minting failed'));
      
      renderComponent();
      
      await waitFor(() => {
        const mintButton = screen.getByText('Mint to Blockchain');
        fireEvent.click(mintButton);
      });
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Minting failed');
      });
    });
  });
});
