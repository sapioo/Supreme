import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './context/GameContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import App from './App';
import { installGlobalErrorLogging } from './lib/logger';
import './index.css';

installGlobalErrorLogging();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </GameProvider>
    </ErrorBoundary>
  </StrictMode>,
);
