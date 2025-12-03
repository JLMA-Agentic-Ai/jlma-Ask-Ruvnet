export default function PDFPresentation({ url, title }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#0a0e27',
            padding: '20px'
        }}>
            <h2 style={{
                color: '#00ff88',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                {title}
            </h2>

            <iframe
                src={`${url}#view=Fit`}
                title={title}
                width="100%"
                height="100%"
                style={{
                    width: '95vw',
                    height: '85vh',
                    border: 'none',
                    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
                    backgroundColor: 'white'
                }}
            />

            <div style={{
                marginTop: '10px',
                color: '#888',
                fontSize: '0.9rem'
            }}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#00ff88', textDecoration: 'none' }}>
                    Open in New Tab
                </a>
            </div>
        </div>
    );
}
