import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Wallet, X, LogOut, Search, Command } from 'lucide-react';
import { Button, Badge, Avatar } from './ui';
import CopyButton from './CopyButton';

const Header = ({ onMenuClick, onConnectWallet, onDisconnectWallet, address, isConnected, onOpenPalette }) => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-xl border-b border-gray-100 fixed w-full top-0 z-40 transition-all duration-300"
    >
      <div className="max-w-[100vw] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Menu toggle (mobile only) */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="md:hidden -ml-2 mr-2"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center space-x-3 md:hidden">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Muse</h1>
            </div>
            
            {/* Desktop spacer to match sidebar width when expanded */}
            <div className="hidden md:block w-64"></div>
          </div>

          {/* Right side tools */}
          <div className="flex items-center space-x-2 sm:space-x-3 ml-auto">
            {/* Command Palette Trigger — Desktop: pill with ⌘K text, Mobile: icon button */}
            {onOpenPalette && (
              <>
                {/* Desktop pill */}
                <button
                  onClick={onOpenPalette}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 transition-all text-sm font-medium group"
                  aria-label="Open command palette (Ctrl+K)"
                  data-testid="header-palette-desktop"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500" />
                  <span className="text-xs text-gray-400">Quick nav</span>
                  <kbd className="ml-1 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono text-gray-400 shadow-sm">
                    ⌘K
                  </kbd>
                </button>

                {/* Mobile icon */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenPalette}
                  className="sm:hidden p-2"
                  aria-label="Open command palette"
                  data-testid="header-palette-mobile"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                </Button>
              </>
            )}

            {/* Network indicator */}
            <Badge variant="success" className="hidden sm:flex">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Testnet
            </Badge>

            {/* Wallet Connection */}
            {isConnected && address ? (
              <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 border border-gray-100 p-1 pr-3 rounded-full hover:bg-gray-100 transition-colors">
                <Avatar
                  size="sm"
                  fallback="W"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div className="flex flex-col pr-2">
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">Connected</p>
                  <div className="flex items-center gap-1 group/address">
                    <p className="text-xs sm:text-sm font-mono font-bold text-gray-900 leading-tight">
                      {address.slice(0, 4)}...{address.slice(-4)}
                    </p>
                    <CopyButton text={address} className="opacity-0 group-hover/address:opacity-100 transition-opacity -my-1 -ml-1" />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnectWallet}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"
                  title="Disconnect"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                icon={Wallet}
                onClick={onConnectWallet}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-2.5 font-semibold text-sm sm:text-base"
              >
                Connect<span className="hidden sm:inline"> Wallet</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
