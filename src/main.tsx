import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StandaloneQuickCapture } from './components/standalone/StandaloneQuickCapture';
import { StandaloneStickyNote } from './components/standalone/StandaloneStickyNote';
import { StandaloneQueueWidget } from './components/standalone/StandaloneQueueWidget';
import './index.css';

// Disable default right-click context menu across the desktop app
if (typeof window !== 'undefined') {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

function RootRouter() {
  const params = new URLSearchParams(window.location.search);
  const windowType = params.get('window');
  const itemId = params.get('id');

  if (windowType === 'capture') {
    return <StandaloneQuickCapture />;
  }

  if (windowType === 'sticky' && itemId) {
    return <StandaloneStickyNote itemId={itemId} />;
  }

  if (windowType === 'queue_widget') {
    return <StandaloneQueueWidget />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);
