import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Image as GalleryIcon,
  FlaskConical,
  Vote,
  History,
  Settings as SettingsIcon,
} from 'lucide-react';

import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CreateArt from './components/CreateArt';
import Gallery from './components/Gallery';
import CommandPalette from './components/CommandPalette';

// Lazy-loaded heavy components
const EvolutionLab = React.lazy(() => import('./components/EvolutionLab').catch(() => ({ default: () => <Placeholder name="Evolution Lab" /> })));
const MuseDAO = React.lazy(() => import('./components/MuseDAO'));
const TransactionHistory = React.lazy(() => import('./components/TransactionHistory'));
const Settings = React.lazy(() => import('./components/Settings'));

const NAVIGATION = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'create', name: 'Create Art', icon: Sparkles },
  { id: 'gallery', name: 'Gallery', icon: GalleryIcon },
  { id: 'evolve', name: 'Evolution Lab', icon: FlaskConical },
  { id: 'dao', name: 'Muse DAO', icon: Vote },
  { id: 'transactions', name: 'Transactions', icon: History },
  { id: 'settings', name: 'Settings', icon: SettingsIcon },
];

function Placeholder({ name }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-gray-400 text-lg">
      {name} — coming soon
    </div>
  );
}

function ActiveView({ tab }) {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'create' && <CreateArt />}
      {tab === 'gallery' && <Gallery />}
      {tab === 'evolve' && <EvolutionLab />}
      {tab === 'dao' && <MuseDAO />}
      {tab === 'transactions' && <TransactionHistory />}
      {tab === 'settings' && <Settings />}
    </React.Suspense>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl+K global shortcut — resolves issue #156
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = useCallback((tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <Header
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <div className="flex flex-1 pt-16 sm:pt-20">
          <Sidebar
            navigation={NAVIGATION}
            activeTab={activeTab}
            onTabChange={handleNavigate}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <main className="flex-1 min-w-0 md:ml-64">
            <ActiveView tab={activeTab} />
          </main>
        </div>

        <CommandPalette
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          onNavigate={handleNavigate}
          activeTab={activeTab}
        />
      </div>
    </ThemeProvider>
  );
}
