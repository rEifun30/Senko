import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { DeckProvider } from './contexts/DeckContext.tsx';
import { StudyActivityProvider } from './contexts/StudyActivityContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DeckProvider>
        <StudyActivityProvider>
          <App />
        </StudyActivityProvider>
      </DeckProvider>
    </AuthProvider>
  </StrictMode>,
);
