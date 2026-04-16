import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './context/GameContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import App from './App';
import './index.css';

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
