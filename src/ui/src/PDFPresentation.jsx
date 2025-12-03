import { useState } from 'react';

export default function PDFPresentation({ url, title, onClose }) {
    const [currentPage, setCurrentPage] = useState(1);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose?.();
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#0a0e27',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column'
            }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* Header with title and close button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                borderBottom: '1px solid rgba(0, 255, 136, 0.2)'
            }}>
                <h2 style={{
                    color: '#00ff88',
                    margin: 0,
                    fontSize: '1.5rem'
                }}>
                    {title}
                </h2>

                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: '2px solid #00ff88',
                        color: '#00ff88',
                        fontSize: '1.5rem',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#00ff88';
                        e.target.style.color = '#0a0e27';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#00ff88';
                    }}
                    title="Exit Presentation (Esc)"
                >
                    ✕
                </button>
            </div>

            {/* PDF Viewer - Full Screen */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflow: 'hidden'
            }}>
                <iframe
                    src={`${url}#view=FitH&pagemode=none`}
                    title={title}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
                        backgroundColor: 'white',
                        borderRadius: '8px'
                    }}
                />
            </div>

            {/* Footer with instructions */}
            <div style={{
                padding: '15px 40px',
                borderTop: '1px solid rgba(0, 255, 136, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{
                    color: '#888',
                    fontSize: '0.9rem'
                }}>
                    <span style={{ color: '#00ff88' }}>Tip:</span> Use the PDF viewer controls to navigate pages, or press <kbd style={{
                        background: 'rgba(0, 255, 136, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        color: '#00ff88'
                    }}>Esc</kbd> to exit
                </div>

                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#00ff88',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'opacity 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                    Open in New Tab →
                </a>
            </div>
        </div>
    );
}
