import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFPresentation({ url, title }) {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    // Load PDF document
    useEffect(() => {
        const loadPDF = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument(url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setLoading(false);
            }
        };
        loadPDF();
    }, [url]);

    // Render current page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return;

        const renderPage = async () => {
            const page = await pdfDoc.getPage(currentPage);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Calculate scale to fit screen
            const viewport = page.getViewport({ scale: 1 });
            const containerWidth = window.innerWidth * 0.95;
            const containerHeight = window.innerHeight * 0.85;

            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY);

            const scaledViewport = page.getViewport({ scale });

            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };

            await page.render(renderContext).promise;
        };

        renderPage();
    }, [pdfDoc, currentPage]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
                e.preventDefault();
                setCurrentPage((prev) => Math.min(prev + 1, totalPages));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setCurrentPage((prev) => Math.max(prev - 1, 1));
            } else if (e.key === 'Home') {
                e.preventDefault();
                setCurrentPage(1);
            } else if (e.key === 'End') {
                e.preventDefault();
                setCurrentPage(totalPages);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [totalPages]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: '#00ff88',
                fontSize: '1.5rem'
            }}>
                Loading presentation...
            </div>
        );
    }

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

            <canvas
                ref={canvasRef}
                style={{
                    maxWidth: '95vw',
                    maxHeight: '80vh',
                    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)'
                }}
            />

            <div style={{
                marginTop: '20px',
                color: '#888',
                fontSize: '1rem',
                display: 'flex',
                gap: '20px',
                alignItems: 'center'
            }}>
                <span style={{ color: '#00ff88' }}>
                    Page {currentPage} / {totalPages}
                </span>
                <span style={{ fontSize: '0.9rem' }}>
                    Use ← → arrow keys to navigate
                </span>
            </div>
        </div>
    );
}
