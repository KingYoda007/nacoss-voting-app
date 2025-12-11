import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    margin: '2rem',
                    background: '#fef2f2',
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    color: '#991b1b'
                }}>
                    <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', cursor: 'pointer' }}>
                        <summary>Show Error Details</summary>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '1rem' }}>
                            {this.state.error && this.state.error.toString()}
                        </p>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#7f1d1d' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </p>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
