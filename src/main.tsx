import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StandaloneQuickCapture } from './components/standalone/StandaloneQuickCapture';
import { StandaloneStickyNote } from './components/standalone/StandaloneStickyNote';
import { StandaloneQueueWidget } from './components/standalone/StandaloneQueueWidget';
import { LandingPage } from './components/landing/LandingPage';
import { ChangelogPage } from './components/landing/ChangelogPage';
import './index.css';

// Disable default right-click context menu across the desktop app
if (typeof window !== 'undefined') {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// Detect if running inside a Tauri desktop runtime
function isTauriEnvironment(): boolean {
  return !!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__;
}

function RootRouter() {
  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window');
  const itemId = params.get('id');
  const appMode = params.get('app');
  const page = params.get('page');
  const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

  // Standalone popup windows (desktop only)
  if (windowType === 'capture') {
    return <StandaloneQuickCapture />;
  }

  if (windowType === 'sticky' && itemId) {
    return <StandaloneStickyNote itemId={itemId} />;
  }

  if (windowType === 'queue_widget') {
    return <StandaloneQueueWidget />;
  }

  // If inside Tauri desktop runtime, always boot the app directly
  if (isTauriEnvironment()) {
    return <App />;
  }

  // Web visitors: show app if ?app=true
  if (appMode === 'true') {
    return <App />;
  }

  // Web visitors: dedicated changelog page
  if (pathname === '/changelog' || pathname === '/changelog/' || page === 'changelog') {
    return <ChangelogPage />;
  }

  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);
