import React from 'react';
import { motion } from 'framer-motion';
import {
  Gallery as GalleryIcon,
  LayoutDashboard,
  Sparkles,
  Command
} from 'lucide-react';

const navItems = [
  { id: 'gallery', label: 'Gallery', icon: GalleryIcon },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', label: 'Mint', icon: Sparkles },
];

const MobileBottomNav = ({ activeTab, onTabChange, onOpenPalette }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile navigation"
      data-testid="mobile-bottom-nav"
    >
      {/* Glassmorphic background */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div
          className="flex items-center justify-around px-2"
          style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] group"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                data-testid={`mobile-nav-${item.id}`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-0.5 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-purple-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`text-[10px] font-semibold mt-0.5 transition-colors duration-200 ${
                    isActive ? 'text-purple-700' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Palette Trigger */}
          <button
            onClick={onOpenPalette}
            className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[64px] group"
            aria-label="Open command palette"
            data-testid="mobile-nav-palette"
          >
            <div className="p-1.5 rounded-xl text-gray-400 group-hover:text-purple-500 transition-colors duration-200">
              <Command className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold mt-0.5 text-gray-400 group-hover:text-purple-500 transition-colors">
              ⌘K
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
