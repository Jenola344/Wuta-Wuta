import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Settings from '../Settings';
import ThemeProvider from '../../contexts/ThemeContext';

jest.mock('../../store/walletStore', () => ({
  useWalletStore: () => ({
    address: '0x123',
    isConnected: false,
    connectWallet: jest.fn(),
    disconnectWallet: jest.fn(),
  }),
}));

describe('Settings component', () => {
  it('renders settings sections and allows theme toggle', () => {
    render(
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    );

    expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(/Current theme/i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode|switch to light mode/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Current theme/i)).toBeInTheDocument();

    const autoSyncCheckbox = screen.getByLabelText('Automatic wallet sync');
    expect(autoSyncCheckbox).toBeInTheDocument();
    expect(autoSyncCheckbox).not.toBeChecked();

    fireEvent.click(autoSyncCheckbox);
    expect(autoSyncCheckbox).toBeChecked();

    const emailInput = screen.getByLabelText('Notification email');
    fireEvent.change(emailInput, { target: { value: 'test@domain.com' } });
    expect(emailInput.value).toBe('test@domain.com');
  });
});
