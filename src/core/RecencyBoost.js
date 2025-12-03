const path = require('path');

/**
 * Extract date from filename or folder path
 * Supports formats:
 * - "2025-08-14 Live Vibe Coding"
 * - "2025-10-02 Ruv Coaching"
 * - Folder: "2025-11-13 Ruv Vibecast"
 */
function extractDate(filePath) {
    // Try to match YYYY-MM-DD pattern
    const datePattern = /(\d{4})-(\d{2})-(\d{2})/;
    const match = filePath.match(datePattern);

    if (match) {
        const [_, year, month, day] = match;
        return new Date(`${year}-${month}-${day}`);
    }

    // Fallback: try to get file modification date
    return null;
}

/**
 * Calculate recency score (0-1, where 1 is most recent)
 * Uses exponential decay: newer = higher score
 */
function calculateRecencyScore(date) {
    if (!date) return 0.5; // Neutral score for unknown dates

    const now = new Date();
    const daysSinceCreation = (now - date) / (1000 * 60 * 60 * 24);

    // Exponential decay with half-life of 30 days
    // This means info from 30 days ago gets 0.5 multiplier,
    // 60 days ago gets 0.25, etc.
    const halfLifeDays = 30;
    const decayFactor = Math.exp(-daysSinceCreation * Math.log(2) / halfLifeDays);

    // Clamp between 0.1 (very old) and 1.0 (today)
    return Math.max(0.1, Math.min(1.0, decayFactor));
}

/**
 * Apply recency boost to search results
 */
function applyRecencyBoost(results) {
    return results.map(result => {
        const date = result.metadata?.date
            ? new Date(result.metadata.date)
            : extractDate(result.metadata?.relativePath || result.id);

        const recencyScore = calculateRecencyScore(date);
        const boostedScore = result.score * recencyScore;

        return {
            ...result,
            originalScore: result.score,
            recencyScore: recencyScore,
            score: boostedScore, // New boosted score
            date: date ? date.toISOString().split('T')[0] : 'Unknown'
        };
    }).sort((a, b) => b.score - a.score); // Re-sort by boosted score
}

module.exports = {
    extractDate,
    calculateRecencyScore,
    applyRecencyBoost
};
