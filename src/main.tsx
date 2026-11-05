import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installLegacyShims } from './utils/legacyShims';

installLegacyShims();

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  stack: string;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    stack: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, stack: '' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ArtaGames Error:', error, errorInfo);
    this.setState({ stack: (errorInfo.componentStack || '').split('\n').slice(0, 6).join('\n') });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#fff', background: '#1c1917', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Si è verificato un errore nel caricamento</h2>
          <p style={{ fontSize: '13px', color: '#a8a29e', marginBottom: '16px' }}>{this.state.error?.message || 'Errore sconosciuto'}</p>
          {this.state.stack && (
            <pre style={{ fontSize: '11px', color: '#78716c', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{this.state.stack}</pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Ricarica Gioco
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
