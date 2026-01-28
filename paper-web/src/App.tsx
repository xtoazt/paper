/**
 * Main App Component
 * Routes between professional landing and dashboard
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import UltimateLanding from './components/pages/UltimateLanding';
import './styles/design-system.css';
import './styles/ultimate-design.css';

// Lazy load Dashboard for performance
const Dashboard = lazy(() => import('./components/Dashboard'));

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Remove loading screen immediately
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      loadingScreen.remove();
    }
    setIsLoading(false);
    
    // Check bootstrap status asynchronously (non-blocking)
    checkBootstrap();
    
    // Handle routing
    const path = window.location.pathname;
    if (path === '/dashboard') {
      setView('dashboard');
    }
  }, []);

  const checkBootstrap = async () => {
    try {
      // Dynamic import to avoid blocking
      const { getBootstrapManager } = await import('./lib/bootstrap');
      const manager = getBootstrapManager();
      const active = await Promise.race([
        manager.isActive(),
        new Promise((resolve) => setTimeout(() => resolve(false), 1000)) // 1s timeout
      ]);
      setIsBootstrapped(active as boolean);
    } catch (error) {
      console.error('Bootstrap check failed:', error);
      // Set to false on error so app still renders
      setIsBootstrapped(false);
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

  if (isLoading) {
    return null; // Let HTML loading screen show
  }

  return (
    <div className="app">
      {view === 'landing' ? (
        <UltimateLanding />
      ) : (
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh' 
          }}>
            Loading Dashboard...
          </div>
        }>
          <Dashboard />
        </Suspense>
      )}
    </div>
  );
}

export default App;
