/**
 * TextChunker - Intelligent text chunking for improved RAG retrieval
 *
 * Splits large documents into semantically meaningful chunks with overlap
 * to ensure relevant content is captured during vector search.
 */

class TextChunker {
    constructor(options = {}) {
        // Chunk size in characters (roughly 512 tokens ≈ 2048 chars)
        this.chunkSize = options.chunkSize || 2000;
        // Overlap between chunks to preserve context
        this.overlap = options.overlap || 200;
        // Minimum chunk size (don't create tiny fragments)
        this.minChunkSize = options.minChunkSize || 100;
        // Sentence boundary markers
        this.sentenceEnders = /[.!?]\s+/g;
        // Paragraph markers
        this.paragraphMarkers = /\n\n+/g;
    }

    /**
     * Chunk a document into smaller, overlapping segments
     * @param {string} text - The full document text
     * @param {object} metadata - Metadata to attach to each chunk
     * @returns {Array} Array of chunk objects with text and metadata
     */
    chunk(text, metadata = {}) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        // Clean and normalize text
        const cleanText = this.normalizeText(text);

        // If text is small enough, return as single chunk
        if (cleanText.length <= this.chunkSize) {
            return [{
                text: cleanText,
                metadata: {
                    ...metadata,
                    chunkIndex: 0,
                    totalChunks: 1,
                    isComplete: true
                }
            }];
        }

        // Split into semantic chunks
        const chunks = this.semanticSplit(cleanText);

        // Add metadata to each chunk
        return chunks.map((chunk, index) => ({
            text: chunk,
            metadata: {
                ...metadata,
                chunkIndex: index,
                totalChunks: chunks.length,
                isComplete: false
            }
        }));
    }

    /**
     * Normalize text by cleaning up whitespace and special chars
     */
    normalizeText(text) {
        return text
            .replace(/\r\n/g, '\n')           // Normalize line endings
            .replace(/\t/g, '    ')            // Convert tabs to spaces
            .replace(/\n{3,}/g, '\n\n')        // Max 2 newlines
            .replace(/[ ]{2,}/g, ' ')          // Max 1 space
            .trim();
    }

    /**
     * Split text at semantic boundaries (paragraphs, sentences)
     */
    semanticSplit(text) {
        const chunks = [];
        let currentChunk = '';
        let lastBreakPoint = 0;

        // First try to split by paragraphs
        const paragraphs = text.split(this.paragraphMarkers);

        for (const paragraph of paragraphs) {
            const trimmedPara = paragraph.trim();
            if (!trimmedPara) continue;

            // If adding this paragraph would exceed chunk size
            if (currentChunk.length + trimmedPara.length + 2 > this.chunkSize) {
                // Save current chunk if it has content
                if (currentChunk.length >= this.minChunkSize) {
                    chunks.push(currentChunk.trim());
                    // Start new chunk with overlap from end of previous
                    currentChunk = this.getOverlapText(currentChunk);
                }

                // If single paragraph is too large, split by sentences
                if (trimmedPara.length > this.chunkSize) {
                    const sentenceChunks = this.splitBySentences(trimmedPara);
                    for (const sentenceChunk of sentenceChunks) {
                        if (currentChunk.length + sentenceChunk.length > this.chunkSize) {
                            if (currentChunk.length >= this.minChunkSize) {
                                chunks.push(currentChunk.trim());
                                currentChunk = this.getOverlapText(currentChunk);
                            }
                        }
                        currentChunk += (currentChunk ? ' ' : '') + sentenceChunk;
                    }
                } else {
                    currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
                }
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
            }
        }

        // Don't forget the last chunk
        if (currentChunk.length >= this.minChunkSize) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Split text by sentences for finer granularity
     */
    splitBySentences(text) {
        const sentences = text.split(this.sentenceEnders);
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (!trimmedSentence) continue;

            if (currentChunk.length + trimmedSentence.length + 2 > this.chunkSize) {
                if (currentChunk.length >= this.minChunkSize) {
                    chunks.push(currentChunk.trim());
                    currentChunk = this.getOverlapText(currentChunk);
                }
            }
            currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
        }

        if (currentChunk.length >= this.minChunkSize) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }

    /**
     * Get overlap text from end of previous chunk
     */
    getOverlapText(text) {
        if (text.length <= this.overlap) {
            return text;
        }

        // Try to break at a word boundary
        const overlapStart = text.length - this.overlap;
        const spaceIndex = text.indexOf(' ', overlapStart);

        if (spaceIndex > 0 && spaceIndex < text.length - 50) {
            return text.substring(spaceIndex + 1);
        }

        return text.substring(overlapStart);
    }

    /**
     * Chunk multiple documents in batch
     * @param {Array} documents - Array of {text, metadata} objects
     * @returns {Array} Flattened array of all chunks
     */
    chunkBatch(documents) {
        const allChunks = [];

        for (const doc of documents) {
            const chunks = this.chunk(doc.text, doc.metadata);
            allChunks.push(...chunks);
        }

        return allChunks;
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(text) {
        // Average: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
}

module.exports = TextChunker;
