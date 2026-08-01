import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
          <h3 className="text-red-300 font-medium mb-2">Something went wrong</h3>
          <p className="text-sm text-red-400 mb-3">{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={this.handleReset}
            className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg hover:bg-red-500/20"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
  });
}