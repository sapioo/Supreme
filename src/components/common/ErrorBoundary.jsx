import { Component } from 'react';

/**
 * ErrorBoundary — catches render errors so the whole app doesn't go blank.
 * Shows a minimal fallback UI with the error message.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a0f',
          color: '#c9a84c',
          fontFamily: 'serif',
          padding: '2rem',
          textAlign: 'center',
          gap: '1rem',
        }}>
          <div style={{ fontSize: '2rem' }}>⚖</div>
          <h2 style={{ color: '#e8d5a3', margin: 0 }}>The Court encountered an error</h2>
          <p style={{ color: '#888', fontSize: '0.9rem', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.6rem 1.5rem',
              background: 'transparent',
              border: '1px solid #c9a84c',
              color: '#c9a84c',
              cursor: 'pointer',
              fontFamily: 'serif',
              fontSize: '1rem',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
