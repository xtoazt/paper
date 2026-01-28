/**
 * Main App Component
 * Routes between professional landing and dashboard
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import UltimateLanding from './components/pages/UltimateLanding';
import { getBootstrapManager } from './lib/bootstrap';
import './styles/design-system.css';
import './styles/ultimate-design.css';

// Lazy load Dashboard for performance
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    checkBootstrap();
    
    // Handle routing
    const path = window.location.pathname;
    if (path === '/dashboard') {
      setView('dashboard');
    }
  }, []);

  const checkBootstrap = async () => {
    try {
      const manager = getBootstrapManager();
      const active = await manager.isActive();
      setIsBootstrapped(active);
    } catch (error) {
      console.error('Bootstrap check failed:', error);
    }
  };

  // Handle routing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setView(path === '/dashboard' ? 'dashboard' : 'landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="app">
      {view === 'landing' ? (
        <UltimateLanding />
      ) : (
        <Suspense fallback={<div className="loading">Loading...</div>}>
          <Dashboard />
        </Suspense>
      )}
    </div>
  );
}

export default App;
