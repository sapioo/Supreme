import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './context/GameContext';
import App from './App';
import { installGlobalErrorLogging } from './lib/logger';
import './index.css';

installGlobalErrorLogging();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
);
