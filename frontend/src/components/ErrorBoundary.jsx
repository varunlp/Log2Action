import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI error boundary caught an error', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}>
        <div className="card" style={{ maxWidth: 460, padding: '2rem', textAlign: 'center', borderRadius: 8 }}>
          <AlertTriangle size={32} color="var(--error)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            The app hit a display error. Reload the page and try again.
          </p>
          <button className="btn-primary" onClick={() => window.location.reload()} style={{ borderRadius: 8 }}>
            <RotateCcw size={15} /> Reload
          </button>
        </div>
      </div>
    );
  }
}
