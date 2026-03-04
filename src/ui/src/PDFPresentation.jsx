import { useState, useEffect } from 'react';

// Detect mobile/touch devices
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 1024 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export default function PDFPresentation({ url, title, onClose }) {
    const [mobile, setMobile] = useState(false);
    const [landscape, setLandscape] = useState(false);

    useEffect(() => {
        setMobile(isMobile());
        const checkOrientation = () => setLandscape(window.innerWidth > window.innerHeight);
        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
    };

    // On mobile, auto-open in new tab and show a clean status screen
    const handleOpenPDF = () => {
        window.open(url, '_blank', 'noopener,noreferrer');
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
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'max(8px, env(safe-area-inset-top, 8px)) clamp(12px, 3vw, 40px) 8px',
                borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
                flexShrink: 0,
            }}>
                <h2 style={{
                    color: '#00ff88',
                    margin: 0,
                    fontSize: 'clamp(0.85rem, 2.5vw, 1.5rem)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '0.5rem',
                }}>
                    {title}
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: '2px solid #00ff88',
                        color: '#00ff88',
                        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                        width: 'clamp(32px, 6vw, 40px)',
                        height: 'clamp(32px, 6vw, 40px)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                    title="Close (Esc)"
                >
                    ✕
                </button>
            </div>

            {/* Content area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                overflow: 'hidden',
                minHeight: 0,
                padding: mobile ? '0' : 'clamp(4px, 1.5vw, 20px)',
            }}>
                {mobile ? (
                    /* Mobile: clean card with open button — no broken iframes */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '2rem 1.5rem',
                        gap: '1.5rem',
                        width: '100%',
                    }}>
                        {/* Large document icon */}
                        <div style={{
                            fontSize: '4rem',
                            lineHeight: 1,
                            opacity: 0.9,
                        }}>
                            {title.toLowerCase().includes('ceo') ? '👔' :
                             title.toLowerCase().includes('cto') ? '🔧' : '📄'}
                        </div>

                        <div style={{
                            color: '#e0e0e0',
                            fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
                            fontWeight: 600,
                            maxWidth: '90%',
                        }}>
                            {title}
                        </div>

                        <div style={{
                            color: '#888',
                            fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                            maxWidth: '85%',
                            lineHeight: 1.5,
                        }}>
                            Tap below to open the full presentation.
                            {!landscape && ' For best viewing, rotate your device to landscape.'}
                        </div>

                        {/* Open button — big, tappable, prominent */}
                        <button
                            onClick={handleOpenPDF}
                            style={{
                                background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                                color: '#0a0e27',
                                border: 'none',
                                padding: '14px 36px',
                                borderRadius: '12px',
                                fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(0, 255, 136, 0.3)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                minWidth: '200px',
                            }}
                        >
                            View Presentation →
                        </button>

                        {!landscape && (
                            <div style={{
                                color: '#00ff88',
                                fontSize: '0.85rem',
                                opacity: 0.8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}>
                                <span style={{ fontSize: '1.2rem' }}>↻</span>
                                Rotate to landscape for slides
                            </div>
                        )}
                    </div>
                ) : (
                    /* Desktop: native PDF iframe */
                    <iframe
                        src={`${url}#view=FitH&pagemode=none`}
                        title={title}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            boxShadow: '0 0 40px rgba(0, 255, 136, 0.3)',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            minHeight: '50vh',
                        }}
                    />
                )}
            </div>

            {/* Footer — desktop only (mobile has inline button) */}
            {!mobile && (
                <div style={{
                    padding: '8px clamp(12px, 3vw, 40px)',
                    borderTop: '1px solid rgba(0, 255, 136, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        <span style={{ color: '#00ff88' }}>Tip:</span> Use arrow keys or scroll to navigate
                    </div>
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#00ff88',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                        }}
                    >
                        Open in New Tab →
                    </a>
                </div>
            )}
        </div>
    );
}
