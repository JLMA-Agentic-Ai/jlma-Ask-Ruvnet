import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#111',
                    color: '#e5e5e5',
                    fontFamily: 'Inter, sans-serif'
                }}>
                    <h1 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Something went wrong</h1>
                    <p style={{ marginBottom: '2rem', color: '#888' }}>The application encountered an unexpected error.</p>
                    <pre style={{
                        background: '#000',
                        padding: '1rem',
                        borderRadius: '6px',
                        border: '1px solid #333',
                        color: '#ef4444',
                        marginBottom: '2rem',
                        maxWidth: '800px',
                        overflow: 'auto'
                    }}>
                        {this.state.error && this.state.error.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 2rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
