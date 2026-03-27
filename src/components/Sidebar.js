import React from 'react';
import { motion } from 'framer-motion';
import { X, Command } from 'lucide-react';

const Sidebar = ({ navigation, activeTab, onTabChange, isOpen, onClose }) => {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Fallback for backwards compatibility
      onTabChange(activeTab);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 md:hidden"
          onClick={handleClose}
          data-testid="sidebar-overlay"
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl dark:shadow-black/30 z-50 md:static md:translate-x-0 md:z-auto border-r border-gray-100 dark:border-gray-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Muse</h2>
            </div>
            <button
              onClick={handleClose}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4 space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Menu</p>
            {navigation.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 font-medium dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive 
                      ? 'text-purple-600' 
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(147,51,234,0.6)]"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
            {/* Quick Nav Hint — desktop only */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 mb-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 text-xs font-medium">
              <Command className="w-3.5 h-3.5" />
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded text-[10px] font-mono shadow-sm">⌘K</kbd>
              <span>for quick nav</span>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Muse AI Art</p>
              <p className="text-xs text-purple-700/80 dark:text-purple-300/80 mt-1">Stellar Testnet v1.0</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
