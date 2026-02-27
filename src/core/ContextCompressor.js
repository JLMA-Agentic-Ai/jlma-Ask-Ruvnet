/**
 * ContextCompressor - Intelligent context compression for RAG
 *
 * Maximizes information density in the LLM context window by:
 * - Extracting most relevant sentences/paragraphs
 * - Removing redundant information
 * - Preserving key facts and code
 * - Maintaining coherence
 */

class ContextCompressor {
    constructor(options = {}) {
        this.maxContextLength = options.maxContextLength || 12000; // chars
        this.maxPerSource = options.maxPerSource || 3000; // chars per source
        this.preserveCode = options.preserveCode !== false; // Keep code blocks
        this.preserveNumbers = options.preserveNumbers !== false; // Keep stats/numbers
    }

    /**
     * Compress multiple sources into optimized context
     * @param {Array} sources - Array of {content, score, source} objects
     * @param {string} query - Original query for relevance scoring
     * @returns {string} Compressed context string
     */
    compress(sources, query) {
        if (!sources || sources.length === 0) return '';

        const queryTerms = this.extractKeyTerms(query);
        const compressed = [];
        let totalLength = 0;

        for (const source of sources) {
            if (totalLength >= this.maxContextLength) break;

            const content = source.content || '';
            const remainingSpace = this.maxContextLength - totalLength;
            const allowedLength = Math.min(this.maxPerSource, remainingSpace);

            // Compress this source
            const compressedContent = this.compressSource(content, queryTerms, allowedLength);

            if (compressedContent.length > 0) {
                compressed.push({
                    ...source,
                    content: compressedContent,
                    originalLength: content.length,
                    compressedLength: compressedContent.length
                });
                totalLength += compressedContent.length;
            }
        }

        // Format final context
        return this.formatContext(compressed);
    }

    /**
     * Compress a single source document
     */
    compressSource(content, queryTerms, maxLength) {
        if (content.length <= maxLength) {
            return content;
        }

        // Extract and score segments
        const segments = this.segmentContent(content);
        const scoredSegments = segments.map(seg => ({
            text: seg,
            score: this.scoreSegment(seg, queryTerms),
            isCode: this.isCodeBlock(seg),
            hasNumbers: this.hasImportantNumbers(seg)
        }));

        // Sort by importance
        scoredSegments.sort((a, b) => {
            // Code and number preservation
            if (this.preserveCode && a.isCode !== b.isCode) {
                return a.isCode ? -1 : 1;
            }
            return b.score - a.score;
        });

        // Select segments up to max length
        const selected = [];
        let currentLength = 0;

        for (const seg of scoredSegments) {
            if (currentLength + seg.text.length > maxLength) {
                // Try to fit a truncated version
                const remaining = maxLength - currentLength;
                if (remaining > 100 && seg.score > 0.3) {
                    selected.push({
                        ...seg,
                        text: this.smartTruncate(seg.text, remaining)
                    });
                }
                break;
            }
            selected.push(seg);
            currentLength += seg.text.length;
        }

        // Reconstruct in original order (roughly)
        selected.sort((a, b) => content.indexOf(a.text) - content.indexOf(b.text));

        return selected.map(s => s.text).join('\n\n');
    }

    /**
     * Segment content into meaningful units
     */
    segmentContent(content) {
        const segments = [];

        // First, extract code blocks as atomic units
        const codeBlockRegex = /```[\s\S]*?```/g;
        const codeBlocks = content.match(codeBlockRegex) || [];
        let contentWithoutCode = content;

        codeBlocks.forEach((block, i) => {
            contentWithoutCode = contentWithoutCode.replace(block, `__CODE_BLOCK_${i}__`);
            segments.push(block);
        });

        // Split remaining content by paragraphs
        const paragraphs = contentWithoutCode.split(/\n\n+/);

        for (const para of paragraphs) {
            const trimmed = para.trim();
            if (trimmed.length < 20) continue; // Skip tiny fragments

            // Check if this is a code block placeholder
            const codeMatch = trimmed.match(/__CODE_BLOCK_(\d+)__/);
            if (codeMatch) continue; // Already added

            // If paragraph is very long, split by sentences
            if (trimmed.length > 500) {
                const sentences = this.splitSentences(trimmed);
                // Group into chunks of 2-3 sentences
                for (let i = 0; i < sentences.length; i += 2) {
                    const chunk = sentences.slice(i, i + 3).join(' ');
                    if (chunk.length > 30) {
                        segments.push(chunk);
                    }
                }
            } else {
                segments.push(trimmed);
            }
        }

        return segments;
    }

    /**
     * Split text into sentences
     */
    splitSentences(text) {
        return text
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.length > 10);
    }

    /**
     * Score a segment for relevance
     */
    scoreSegment(segment, queryTerms) {
        if (!segment || queryTerms.length === 0) return 0.5;

        const segmentLower = segment.toLowerCase();
        let score = 0;

        // Term matching
        let matches = 0;
        for (const term of queryTerms) {
            if (segmentLower.includes(term)) {
                matches++;
                // Bonus for early occurrence (more likely to be topic)
                const position = segmentLower.indexOf(term);
                score += 0.1 * (1 - position / segmentLower.length);
            }
        }
        score += (matches / queryTerms.length) * 0.5;

        // Information density bonus
        const wordCount = segment.split(/\s+/).length;
        const uniqueWords = new Set(segment.toLowerCase().split(/\s+/)).size;
        const diversity = uniqueWords / wordCount;
        score += diversity * 0.2;

        // Code presence bonus
        if (this.isCodeBlock(segment)) {
            score += 0.15;
        }

        // Instructional content bonus
        if (/step\s*\d|first|then|next|example|note:|important:/i.test(segment)) {
            score += 0.1;
        }

        return Math.min(1, score);
    }

    /**
     * Check if segment is a code block
     */
    isCodeBlock(segment) {
        return /^```|`[^`]+`|^\s{4,}\S|function\s*\(|const\s+\w+\s*=|import\s+\{/.test(segment);
    }

    /**
     * Check if segment has important numbers/stats
     */
    hasImportantNumbers(segment) {
        // Look for percentages, versions, specific numbers
        return /\d+%|\bv\d+\.\d+|\$\d+|\d{3,}/.test(segment);
    }

    /**
     * Smart truncation that preserves meaning
     */
    smartTruncate(text, maxLength) {
        if (text.length <= maxLength) return text;

        // Try to truncate at sentence boundary
        const truncated = text.substring(0, maxLength);
        const lastSentence = truncated.lastIndexOf('. ');
        const lastNewline = truncated.lastIndexOf('\n');

        const cutPoint = Math.max(lastSentence, lastNewline);

        if (cutPoint > maxLength * 0.5) {
            return text.substring(0, cutPoint + 1) + '...';
        }

        // Fall back to word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > maxLength * 0.8) {
            return text.substring(0, lastSpace) + '...';
        }

        return truncated + '...';
    }

    /**
     * Extract key terms from query
     */
    extractKeyTerms(query) {
        if (!query) return [];

        const stopwords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'can', 'i', 'you', 'he', 'she',
            'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
            'why', 'how', 'this', 'that', 'these', 'those', 'my', 'your',
            'me', 'him', 'her', 'us', 'them', 'please', 'show', 'tell',
            'explain', 'about', 'with', 'for', 'from', 'into', 'to'
        ]);

        return query
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopwords.has(w));
    }

    /**
     * Convert github:// URI to real https://github.com/ URL
     */
    githubUriToUrl(filePath) {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;
        if (filePath.startsWith('github://')) {
            // github://org/repo/path → https://github.com/org/repo/blob/main/path
            const parts = filePath.replace('github://', '').split('/');
            if (parts.length >= 3) {
                const org = parts[0];
                const repo = parts[1];
                const rest = parts.slice(2).join('/');
                return `https://github.com/${org}/${repo}/blob/main/${rest}`;
            }
            return `https://github.com/${filePath.replace('github://', '')}`;
        }
        if (filePath.startsWith('/tmp/ruvnet-repos/')) {
            // /tmp/ruvnet-repos/{repo-name}/... → https://github.com/ruvnet/{repo-name}/blob/main/...
            const withoutPrefix = filePath.replace('/tmp/ruvnet-repos/', '');
            const parts = withoutPrefix.split('/');
            if (parts.length >= 2) {
                const repo = parts[0];
                const rest = parts.slice(1).join('/');
                return `https://github.com/ruvnet/${repo}/blob/main/${rest}`;
            }
            return null;
        }
        return null;
    }

    /**
     * Format compressed sources into final context with rich metadata
     */
    formatContext(sources) {
        return sources.map((s, i) => {
            const sourceId = s.source || s.id || 'Unknown';
            const score = (s.score || 0).toFixed(2);
            const pkg = s.package_name || s.metadata?.package_name;
            const docType = s.doc_type || s.metadata?.doc_type;
            const filePath = s.file_path || s.metadata?.file_path;
            const topics = s.topics || s.metadata?.topics || [];

            let header = `[Source ${i + 1}: ${sourceId} | Relevance: ${score}]`;

            const metaLines = [];
            if (pkg) metaLines.push(`Repository: ${pkg}`);
            if (docType) metaLines.push(`Type: ${docType}`);
            const url = this.githubUriToUrl(filePath);
            if (url) metaLines.push(`URL: ${url}`);
            if (topics.length > 0) metaLines.push(`Topics: ${topics.slice(0, 5).join(', ')}`);

            const compression = s.originalLength > s.compressedLength
                ? ` (compressed ${Math.round((1 - s.compressedLength / s.originalLength) * 100)}%)`
                : '';

            const metaBlock = metaLines.length > 0 ? '\n' + metaLines.join(' | ') : '';
            return `${header}${compression}${metaBlock}\n${s.content}`;
        }).join('\n\n---\n\n');
    }
}

module.exports = ContextCompressor;
