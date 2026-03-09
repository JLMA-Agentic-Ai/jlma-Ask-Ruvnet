/**
 * ResponseValidator - Validates LLM output for mandatory structural elements
 *
 * Classifies queries by topic to determine which response elements are expected
 * (diagrams, tables, code blocks), then checks whether the LLM response
 * actually contains them. When elements are missing, it can generate a
 * supplementary prompt or a user-facing suggestion.
 *
 * Phase 3 of the Ask-RuvNet Quality Plan.
 */

class ResponseValidator {
    constructor(options = {}) {
        // Patterns that indicate the query needs specific response elements
        this.diagramPatterns = options.diagramPatterns || [
            /architect/i, /workflow/i, /how\s+does/i, /how\s+do/i,
            /flow/i, /pipeline/i, /process/i, /system\s+design/i,
            /component/i, /interact/i, /data\s+flow/i, /sequence/i,
            /lifecycle/i, /topology/i, /orchestrat/i
        ];

        this.tablePatterns = options.tablePatterns || [
            /compar/i, /\bvs\b/i, /versus/i, /difference/i,
            /trade\s?off/i, /pros?\s+and\s+cons/i, /which\s+(one|is\s+better)/i,
            /options/i, /alternatives/i, /benchmark/i
        ];

        this.codePatterns = options.codePatterns || [
            /how\s+to/i, /getting\s+started/i, /build/i, /implement/i,
            /example/i, /tutorial/i, /setup/i, /install/i, /configure/i,
            /create\s+a/i, /write\s+a/i, /code/i, /snippet/i, /demo/i
        ];
    }

    /**
     * Classify what structural elements a query topic requires.
     * @param {string} message - The user's query
     * @returns {{ needsDiagram: boolean, needsTable: boolean, needsCode: boolean }}
     */
    classifyQuery(message) {
        if (!message || typeof message !== 'string') {
            return { needsDiagram: false, needsTable: false, needsCode: false };
        }

        return {
            needsDiagram: this.diagramPatterns.some(p => p.test(message)),
            needsTable:   this.tablePatterns.some(p => p.test(message)),
            needsCode:    this.codePatterns.some(p => p.test(message)),
        };
    }

    /**
     * Check whether a response contains the required structural elements.
     * Always checks for TL;DR and Explore Further sections regardless of
     * query classification.
     *
     * @param {string} response - The LLM response text
     * @param {{ needsDiagram: boolean, needsTable: boolean, needsCode: boolean }} requirements
     * @returns {{ valid: boolean, missing: string[] }}
     */
    validate(response, requirements) {
        if (!response || typeof response !== 'string') {
            return { valid: false, missing: ['response is empty'] };
        }

        const missing = [];

        // Mandatory sections (always checked)
        if (!/##\s*TL;?\s*DR/i.test(response)) {
            missing.push('TL;DR section');
        }
        if (!/##\s*Explore\s+Further/i.test(response)) {
            missing.push('Explore Further section');
        }

        // Conditional checks based on query classification
        if (requirements.needsDiagram && !/```mermaid/i.test(response)) {
            missing.push('Mermaid diagram');
        }

        if (requirements.needsTable && !/\|.*\|.*\|/m.test(response)) {
            missing.push('comparison table');
        }

        if (requirements.needsCode && !/```(?!mermaid)[a-z]*\n/i.test(response)) {
            missing.push('code example');
        }

        return {
            valid: missing.length === 0,
            missing,
        };
    }

    /**
     * Generate a supplementary prompt that could be sent to the LLM to fill
     * in missing elements. Currently used for logging/monitoring only.
     *
     * @param {string} topic - The original query topic
     * @param {string[]} missing - Array of missing element names
     * @returns {string} A prompt string requesting the missing elements
     */
    getSupplementaryPrompt(topic, missing) {
        if (!missing || missing.length === 0) return '';

        const parts = [];

        for (const item of missing) {
            switch (item) {
                case 'Mermaid diagram':
                    parts.push(`Add a Mermaid diagram illustrating ${topic}`);
                    break;
                case 'comparison table':
                    parts.push(`Add a comparison table for ${topic}`);
                    break;
                case 'code example':
                    parts.push(`Add a practical code example demonstrating ${topic}`);
                    break;
                case 'TL;DR section':
                    parts.push(`Add a ## TL;DR section summarizing the key point in 2-3 sentences`);
                    break;
                case 'Explore Further section':
                    parts.push(`Add an ## Explore Further section with 3-4 follow-up questions`);
                    break;
                default:
                    parts.push(`Add ${item} for ${topic}`);
            }
        }

        return parts.join('. ') + '.';
    }

    /**
     * Build a user-facing suggestion note when structural elements are missing.
     * This is appended to the response instead of doing a second LLM call.
     *
     * @param {string[]} missing - Array of missing element names
     * @returns {string} Markdown-formatted suggestion, or empty string if nothing is missing
     */
    buildSuggestionNote(missing) {
        if (!missing || missing.length === 0) return '';

        const actions = [];
        if (missing.includes('Mermaid diagram')) {
            actions.push('"Visualize" to see an architecture diagram');
        }
        if (missing.includes('code example')) {
            actions.push('"Code Example" to see implementation details');
        }
        if (missing.includes('comparison table')) {
            actions.push('"Compare" to see a side-by-side comparison');
        }

        if (actions.length === 0) return '';

        return `\n\n---\n> **Tip:** Try clicking ${actions.join(' or ')} for a richer answer.`;
    }
}

module.exports = ResponseValidator;
