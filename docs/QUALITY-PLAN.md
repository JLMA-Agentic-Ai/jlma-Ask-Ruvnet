# Ask-RuvNet Quality Improvement Plan

> Updated: 2026-03-08 | Version 1.0.0
> Created: 2026-03-08

This document is the master execution plan for improving Ask-RuvNet's output quality, infrastructure hygiene, and newcomer experience. Every issue is numbered, prioritized, and has a concrete fix + verification strategy.

---

## Issue Registry

### CRITICAL (System reliability or data integrity at risk)

**C-1: No startup validation between RVF store and content sidecar**
- Severity: CRITICAL
- Files: `/src/core/RvfStore.js`
- Problem: `RvfStore.initialize()` loads `knowledge.rvf` and `content-sidecar.json.gz` independently. If the sidecar is stale, missing entries, or has a schema mismatch relative to the RVF file, search results silently return `[Content not found]` for affected entries. There is no count comparison, no hash check, no version stamp.
- Fix: After loading both files, compare `this.vectorCount` (from RVF status) against `Object.keys(this.contentMap).length`. If they differ by more than 5%, log a warning with the exact counts. Add a `sidecarVersion` field to the sidecar JSON and check it matches a `version` field stored in the RVF metadata. Emit a structured startup health report to the `/health` endpoint.
- Verification: Start the server with a deliberately truncated sidecar. Confirm the warning is logged and `/health` reports `vectorStore: 'degraded'` instead of `'ok'`.
- Complexity: S

**C-2: Duplicated RAG pipeline between `/api/chat` and `/api/chat/stream`**
- Severity: CRITICAL (maintenance risk -- bugs fixed in one endpoint silently stay broken in the other)
- Files: `/src/server/app.js` (lines ~570-908 and ~913-1154)
- Problem: The entire 8-stage RAG pipeline (query expansion, hybrid search, multi-hop retrieval, re-ranking, recency boost, gold boost, diversity filter, context compression) is copy-pasted between the two endpoints. The system prompt construction and `levelInstructions` map are also duplicated. The streaming endpoint has a slightly different CRITICAL instruction appended ("You MUST include at least ONE mermaid diagram...") that the non-streaming endpoint lacks. Any future fix applied to one will be missed in the other.
- Fix: Extract the RAG pipeline into a shared function: `async function runRAGPipeline(message, mode)` that returns `{ context, sources, systemPrompt }`. Both endpoints call this function and only differ in how they invoke the LLM (batch vs stream) and format the response.
- Verification: After refactoring, run the same query against both endpoints. Confirm the `sources` array and `context` string are identical. Diff the system prompts sent to the LLM -- they should now be identical.
- Complexity: M

**C-3: Hardcoded Gemini API key in source code**
- Severity: CRITICAL (secret exposure)
- Files: `/src/server/app.js` (line 78)
- Problem: `const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDR-2kQuxZ1HJyZ2-IhUHmPN0XG3DS4HgY';` -- a real API key is committed to source. Even though it has an env var fallback, the default is a live key in plaintext.
- Fix: Remove the hardcoded fallback. Change to `const GEMINI_API_KEY = process.env.GEMINI_API_KEY;` and add a guard: if no key is set, disable the visualize endpoint gracefully and log a warning at startup.
- Verification: Start the server without `GEMINI_API_KEY` set. Confirm `/api/visualize` returns a 503 with a clear message instead of crashing. Confirm the hardcoded key no longer appears in any file via `grep -r 'AIzaSy'`.
- Complexity: S

---

### HIGH (Directly impacts output quality or newcomer experience)

**H-1: No LLM output post-validation for mandatory elements**
- Severity: HIGH
- Files: `/src/server/app.js` (new function + integration at ~lines 870-905 and streaming equivalent)
- Problem: The system prompt mandates Mermaid diagrams, comparison tables, code examples, TL;DR sections, and "Explore Further" sections. But there is zero post-validation. The LLM frequently omits diagrams or tables, especially on shorter queries or when using less capable models in the fallback chain (e.g., Groq llama-3.3 ignores complex formatting instructions more often than GPT-4o or Claude). This is the single biggest quality gap.
- Fix: Create a `ResponseValidator` module at `/src/core/ResponseValidator.js`. After the LLM returns its answer, check for:
  1. Contains ` ```mermaid` block (required for architecture/workflow topics)
  2. Contains `|` table markup (required for comparison topics)
  3. Contains `## TL;DR` section
  4. Contains `## Explore Further` section
  5. Contains at least one ` ```bash` or ` ```javascript` code block
  If the response is missing mandatory elements based on query classification (architecture question = needs diagram; comparison question = needs table), append a follow-up LLM call with a targeted prompt: "The response is missing a Mermaid diagram. Add one that illustrates [topic]. Return ONLY the diagram block." Then splice it into the response at the appropriate section.
- Verification: Send 10 test queries covering architecture, comparison, how-to, and concept topics. Score each response for the 5 elements. Before the fix, expect ~60% compliance. After, expect >90%.
- Complexity: L

**H-2: Context compression may be too aggressive for quality output**
- Severity: HIGH
- Files: `/src/core/ContextCompressor.js`, `/src/server/app.js` (line 330-334)
- Problem: `maxContextLength` is 16,000 chars and `maxPerSource` is 4,000 chars. With 8 sources and graduated allocation, later sources get as little as 1,600 chars. But the knowledge base has entries that are 5,000-10,000 chars of dense technical content. Over-compression strips out code examples, CLI commands, and architectural details that the LLM needs to generate grounded, accurate responses. The system prompt explicitly demands "copy-pasteable code examples" and "GROUNDED EXAMPLES ONLY" but the compressed context often lacks the raw material.
- Fix: Increase `maxContextLength` to 24,000 and `maxPerSource` to 6,000. This is safe because: (a) even with 8 sources at max, total context is ~48K chars which fits comfortably in the LLM context window alongside the system prompt and history; (b) the models in the provider chain (llama-3.3, GPT-4o, Claude Sonnet) all support 128K+ context windows. Additionally, modify the graduated allocation curve to give top-3 sources nearly full allocation (95%, 85%, 75%) and taper more aggressively for sources 4-8.
- Verification: Compare context output for the query "How does HNSW work in RuVector?" before and after the change. The compressed context should be at least 40% larger and retain code examples from gold entries.
- Complexity: S

**H-3: Follow-up suggestions are hardcoded keyword matches, not semantic**
- Severity: HIGH
- Files: `/src/ui/src/App.jsx` (lines 76-97)
- Problem: `getFollowUpSuggestions()` uses simple `string.includes()` checks against a handful of keywords. This means: (a) many responses get the generic fallback ("Tell me more about this"); (b) suggestions don't adapt to the actual content of the response; (c) suggestions are static per keyword group regardless of what was discussed. A user asking about "RuVector WASM performance" gets the same follow-ups as someone asking about "RuVector PostgreSQL integration."
- Fix: Two-part approach:
  1. **Backend**: Add a `suggestedFollowUps` field to the LLM system prompt instructing it to generate 3 contextually relevant follow-up questions in the "Explore Further" section. Parse the "Explore Further" section from the response and extract the questions.
  2. **Frontend**: When the response contains an "Explore Further" section with parseable questions, use those instead of the keyword-matched defaults. Fall back to keyword matching only if extraction fails.
- Verification: Ask "What is the RVF cognitive container format?" and confirm the follow-up suggestions are specific to RVF (e.g., "What are the 24 segments?", "How does RVF enable offline AI?") rather than generic.
- Complexity: M

**H-4: No inline source citations in LLM responses**
- Severity: HIGH
- Files: `/src/server/RuvPersona.js`, `/src/core/ContextCompressor.js`
- Problem: The system prompt has a "SOURCE CITATION" section but it only instructs the LLM to include markdown links "naturally." In practice, responses rarely cite specific sources. Users cannot tell which claims come from gold-curated KB entries vs. silver architecture docs. This undermines trust and educational value.
- Fix: Modify the context formatting in `ContextCompressor.formatContext()` to number each source clearly: `[Source 1]`, `[Source 2]`, etc. Then add an explicit instruction to the system prompt: "When making a factual claim that comes from a specific source, include the source number in brackets, e.g., 'HNSW provides 150x faster search [Source 1]'. Aim for at least 3 citations per response." On the frontend, add a tooltip or hover behavior on `[Source N]` text that shows the source card.
- Verification: Ask "What is RuVector?" and confirm the response contains at least 2 bracketed source citations. Hover over a citation in the UI and confirm the tooltip shows the correct source.
- Complexity: M

**H-5: Stale split files consuming disk and causing confusion**
- Severity: HIGH (operational hygiene)
- Files: Root directory -- `knowledge.rvf.gz.part-aa`, `knowledge.rvf.gz.part-ab`, `ruvector-kb.tar.gz.part-aa`, `ruvector-kb.tar.gz.part-ab`
- Problem: Four split archive files totaling hundreds of MB sit in the project root. They are never merged or referenced by any code path. They were likely created during an earlier data pipeline step and never cleaned up. They bloat the repo, confuse new contributors, and may be accidentally included in deployments.
- Fix: Delete the four files. Add entries to `.gitignore`: `*.part-aa`, `*.part-ab`, `*.part-*`. Verify the Dockerfile does not reference them.
- Verification: `ls *.part-*` returns nothing. Build and deploy still work. `knowledge.rvf` (the actual file used by RvfStore) is unaffected.
- Complexity: S

---

### MEDIUM (Improves quality or UX but not blocking)

**M-1: Quick Actions appear AFTER response instead of proactively during streaming**
- Severity: MEDIUM
- Files: `/src/ui/src/App.jsx` (around lines 1017-1070)
- Problem: Quick Actions (Visualize, Code Example, Simplify, Deep Dive) and follow-up suggestions only render after the streaming response is fully complete. During the streaming phase, which can take 5-15 seconds, the user stares at scrolling text with no interactivity. If the response is long, the actions are below the fold and easy to miss.
- Fix: (a) Show a "thinking" phase Quick Action bar immediately after the user sends a message (before streaming starts) with contextually relevant actions based on the query text. For example, if the query contains "architecture" or "how does," show a "Visualize" button that queues a visualization request. (b) After streaming completes, update the Quick Actions based on actual response content.
- Verification: Send an architecture question and observe that a "Visualize this" button appears within 1 second (during RAG retrieval), before the streamed response begins.
- Complexity: M

**M-2: Learning level selector exists but has no visual indication of active state or tooltip**
- Severity: MEDIUM
- Files: `/src/ui/src/App.jsx` (lines 874-886), `/src/ui/src/App.css`
- Problem: The level selector (`<select>`) at the top of the UI works and sends the `mode` parameter to the backend. But newcomers do not know what the levels mean. There is no tooltip, no explanatory text, and no visual indication that changing the level affects response style. A first-time user likely never notices or touches it.
- Fix: Add a descriptive tooltip to the level selector that explains each option: "Simple = ELI5, Beginner = new to coding, Balanced = intermediate, Technical = expert depth." Use a title attribute or a small info icon with a popover. Also add a brief animated indicator when the level changes (e.g., a brief highlight or toast: "Responses will now be tailored for beginners").
- Verification: Hover over the level selector and confirm the tooltip appears. Change level and confirm a brief visual acknowledgment.
- Complexity: S

**M-3: `/health` endpoint does not report vector store or search subsystem status**
- Severity: MEDIUM
- Files: `/src/server/app.js` (lines 1156-1168)
- Problem: The health endpoint always returns `vectorStore: 'unknown'`. It does not check if the RvfStore is initialized, if the BM25 index is built, or if the content sidecar loaded correctly. This means monitoring tools (Railway, uptime checkers) cannot detect degraded search quality.
- Fix: Enhance the health endpoint to check: (a) `reasoningBank` is initialized and has a non-zero vector count; (b) `hybridSearch` is initialized with a non-zero document count; (c) content sidecar has entries. Report each as `ok`, `degraded`, or `failed`. Overall status should be `degraded` if any subsystem is not fully healthy.
- Verification: Restart the server. Hit `/health` immediately (before initialization completes) and confirm it reports `vectorStore: 'initializing'`. After initialization, confirm it reports `ok` with vector count and BM25 document count.
- Complexity: S

**M-4: No confidence scoring shown to users**
- Severity: MEDIUM
- Files: `/src/server/app.js`, `/src/ui/src/App.jsx`
- Problem: The backend computes detailed relevance scores for each source (0.0-1.0) and passes them to the frontend. The frontend renders these as percentage badges on source cards. But there is no overall "confidence" indicator for the response itself. A response grounded in 8 high-scoring gold sources looks identical to one scraped together from 2 low-scoring bronze sources.
- Fix: Compute an aggregate confidence score on the backend: `avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length`. Include `goldCount` (number of gold-tier sources used). Send both in the response metadata. On the frontend, display a confidence indicator next to the response: a colored bar or badge (green for avg > 0.6 with gold sources, yellow for avg 0.4-0.6, red for avg < 0.4 or zero sources).
- Verification: Ask a well-covered topic ("What is Ruflo?") and confirm a green confidence indicator. Ask an obscure or off-topic question and confirm a yellow or red indicator with a note like "This answer may be less reliable -- limited knowledge base coverage."
- Complexity: M

**M-5: System prompt mismatch between streaming and non-streaming endpoints**
- Severity: MEDIUM (symptom of C-2, but independently noteworthy)
- Files: `/src/server/app.js`
- Problem: The streaming endpoint (line 1128) appends an additional CRITICAL instruction: "You MUST include at least ONE mermaid diagram and ONE markdown table in every response about architecture, workflows, or comparisons." The non-streaming endpoint does not have this instruction. This means quality varies depending on which endpoint the frontend uses (it currently uses streaming).
- Fix: This is resolved by C-2 (extracting the shared RAG pipeline). Include the stronger instruction in the shared system prompt.
- Verification: Resolved when C-2 is implemented.
- Complexity: S (part of C-2)

**M-6: BM25 index caps at 50,000 documents but KB has 100K+ vectors**
- Severity: MEDIUM
- Files: `/src/server/app.js` (line 517)
- Problem: `const limit = Math.min(allMeta.length, 50000);` artificially caps the BM25 index at 50K entries. With 100K+ vectors in the RVF store, roughly half the knowledge base is invisible to keyword search. This means exact-match queries for terms that happen to be in the uncapped portion will miss relevant results.
- Fix: Raise the cap to 100,000 or remove it entirely. BM25 indexing is a one-time O(n) operation at startup. With 100K documents, memory usage for the term frequency maps is approximately 50-80MB, well within the Railway deployment's memory budget. Alternatively, prioritize gold/curated entries by loading them first, then fill remaining capacity with architecture docs.
- Verification: After the change, check `hybridSearch.getStats()` -- `totalDocuments` should match the full KB size. Search for a specific term known to be in a high-numbered entry and confirm it returns results.
- Complexity: S

**M-7: No test suite for the RAG pipeline**
- Severity: MEDIUM
- Files: New file: `/tests/rag-pipeline.test.js`
- Problem: There are no automated tests for the query expansion, hybrid search, re-ranking, context compression, or response validation pipeline. The only existing tests are UI interaction tests (`scripts/test-ui-interactions.mjs`). This means regressions in search quality are only caught when Stuart manually tests.
- Fix: Create a test suite using Node's built-in test runner (or Jest if already in deps) that:
  1. Tests `QueryExpander.expand()` with representative queries (simple, complex, comparison)
  2. Tests `HybridSearch.bm25Search()` with a small fixture index
  3. Tests `ContextCompressor.compress()` output length bounds
  4. Tests `ReRanker.rerank()` ordering with known scores
  5. Tests the gold/recency boost logic with mock data
  Add to `package.json` scripts: `"test:rag": "node --test tests/rag-pipeline.test.js"`.
- Verification: `npm run test:rag` passes with all assertions green.
- Complexity: M

---

### LOW (Polish, cleanup, or future improvement)

**L-1: 174K orphaned rows in `ask_ruvnet.architecture_docs` (PostgreSQL)**
- Severity: LOW (not queried at runtime since RVF is the source of truth, but wastes DB resources)
- Files: PostgreSQL database (port 5435), not application code
- Problem: The old architecture_docs table in PostgreSQL contains 174K rows that are never queried by the production application (which uses RVF native). These consume disk and memory on the database server.
- Fix: After confirming RVF native is the sole production backend (it is), drop or truncate the table: `TRUNCATE ask_ruvnet.architecture_docs;` or archive to a dump file first.
- Verification: Production app continues to work without any degradation. `/health` and search results are unchanged.
- Complexity: S

**L-2: Browser assets (`knowledge-sq8.bin`) don't auto-rebuild**
- Severity: LOW (only affects the RVF Engine browser demo, not main chat)
- Files: `/scripts/build-quantized-rvf.mjs`, build pipeline
- Problem: When the knowledge base is updated and a new `knowledge.rvf` is generated, the browser-side scalar quantized files (`knowledge-sq8.bin.gz`, `knowledge-sq8-params.bin.gz`, `knowledge-meta.json.gz`) are not automatically rebuilt. They must be manually regenerated with `node scripts/build-quantized-rvf.mjs`.
- Fix: Add `build-quantized-rvf.mjs` as a post-step in the data pipeline or Dockerfile. If the RVF file timestamp is newer than the browser assets, rebuild automatically.
- Verification: Update `knowledge.rvf`, run the build pipeline, and confirm browser assets are regenerated with matching timestamps.
- Complexity: S

**L-3: `knowledge.rvf.idmap.json` in project root -- purpose unclear**
- Severity: LOW
- Files: Root -- `knowledge.rvf.idmap.json`
- Problem: This file sits in the project root alongside `knowledge.rvf`. It is not referenced by any code path in `RvfStore.js` or any other module. It may be a build artifact from the RVF conversion script.
- Fix: Verify it is not loaded anywhere (`grep -r 'idmap' src/`). If unused, delete it and add to `.gitignore`.
- Verification: Server starts and searches work without the file present.
- Complexity: S

**L-4: `vectors.db` SQLite file in project root -- legacy artifact**
- Severity: LOW
- Files: Root -- `vectors.db`
- Problem: A SQLite database file exists in the project root. The application has migrated to RVF native format. This file is likely from the legacy `RuvectorStore` backend and is no longer needed.
- Fix: Verify `RuvectorStore.js` (the legacy backend) is the only code that might reference it, and that the production deployment uses RVF. If confirmed unused, delete it.
- Verification: Server starts and operates correctly without `vectors.db`.
- Complexity: S

**L-5: `getFollowUpSuggestions` has overlapping keyword groups**
- Severity: LOW (superseded by H-3 fix)
- Files: `/src/ui/src/App.jsx` (lines 76-97)
- Problem: The keyword groups overlap (e.g., "vector" matches both the RuVector group and could match HNSW). The first match wins, which means a response about "HNSW vector search performance" would get RuVector follow-ups even if the response focused on performance aspects.
- Fix: This is fully addressed by H-3 (switching to LLM-generated semantic follow-ups). The keyword matcher becomes the fallback only.
- Verification: Covered by H-3 verification.
- Complexity: S

---

## Execution Phases

### Phase 1: Foundation and Safety (Day 1)
**Goal**: Fix critical reliability issues and remove security risk.

| Item | Description | Est. |
|------|-------------|------|
| C-3 | Remove hardcoded Gemini API key | S |
| C-1 | Add RVF/sidecar startup validation | S |
| H-5 | Delete stale split files, update .gitignore | S |
| M-3 | Enhance /health endpoint with subsystem status | S |
| L-3 | Remove unused `knowledge.rvf.idmap.json` | S |
| L-4 | Remove unused `vectors.db` | S |

**Definition of Done - Phase 1**:
- [ ] No hardcoded API keys in any source file (`grep -r 'AIzaSy' src/` returns nothing)
- [ ] Server startup logs include sidecar validation: count comparison and match/mismatch status
- [ ] `/health` endpoint returns `vectorStore`, `hybridSearch`, and `sidecar` subsystem statuses
- [ ] No `*.part-*`, `idmap.json`, or `vectors.db` files in project root
- [ ] `.gitignore` updated with `*.part-*` pattern
- [ ] `npm run build` succeeds with zero errors
- [ ] Server starts and responds to chat queries without regression

---

### Phase 2: RAG Pipeline Quality (Day 2)
**Goal**: Improve the quality of context delivered to the LLM.

| Item | Description | Est. |
|------|-------------|------|
| C-2 | Extract shared RAG pipeline function | M |
| H-2 | Increase context compression limits | S |
| M-5 | Unify system prompt (resolved by C-2) | S |
| M-6 | Raise BM25 index cap to 100K | S |

**Definition of Done - Phase 2**:
- [ ] Single `runRAGPipeline()` function used by both endpoints
- [ ] System prompt is identical between `/api/chat` and `/api/chat/stream` (diff produces no output)
- [ ] `ContextCompressor` uses `maxContextLength: 24000` and `maxPerSource: 6000`
- [ ] `hybridSearch.getStats().totalDocuments` matches full KB size (no 50K cap)
- [ ] Compressed context for "How does HNSW work?" is at least 8,000 chars (vs ~4,000 before)
- [ ] Both endpoints return identical source arrays for the same query
- [ ] Server starts and responds without regression

---

### Phase 3: Output Quality (Day 3-4)
**Goal**: Ensure LLM responses consistently include diagrams, tables, citations, and quality indicators.

| Item | Description | Est. |
|------|-------------|------|
| H-1 | Build ResponseValidator with post-validation | L |
| H-4 | Add inline source citations | M |
| M-4 | Add confidence scoring to responses | M |

**Definition of Done - Phase 3**:
- [ ] `ResponseValidator` module exists at `/src/core/ResponseValidator.js`
- [ ] Architecture queries produce responses with Mermaid diagrams >90% of the time (test with 10 queries)
- [ ] Comparison queries produce responses with markdown tables >90% of the time
- [ ] Responses contain at least 2 bracketed source citations (e.g., `[Source 1]`)
- [ ] Frontend displays a confidence indicator (green/yellow/red) next to each response
- [ ] Low-confidence responses show an advisory note
- [ ] Sources in context are numbered `[Source 1]`, `[Source 2]` for citation

---

### Phase 4: UX Polish (Day 5)
**Goal**: Make the interactive experience feel responsive and intelligent.

| Item | Description | Est. |
|------|-------------|------|
| H-3 | LLM-generated follow-up suggestions | M |
| M-1 | Proactive Quick Actions during streaming | M |
| M-2 | Level selector tooltips and change indicator | S |

**Definition of Done - Phase 4**:
- [ ] Follow-up suggestions match the actual response content, not generic keyword groups
- [ ] "Explore Further" section in LLM output is parsed and used for follow-up pills
- [ ] Quick Actions appear within 1 second of query submission (pre-streaming)
- [ ] Level selector shows tooltips describing each option on hover
- [ ] Changing the level shows a brief visual acknowledgment (toast or highlight)

---

### Phase 5: Test Coverage and Cleanup (Day 6)
**Goal**: Prevent quality regressions and clean up technical debt.

| Item | Description | Est. |
|------|-------------|------|
| M-7 | Create RAG pipeline test suite | M |
| L-1 | Clean up orphaned PostgreSQL rows | S |
| L-2 | Auto-rebuild browser assets in pipeline | S |

**Definition of Done - Phase 5**:
- [ ] `npm run test:rag` exists and passes with all assertions
- [ ] Tests cover: query expansion, BM25 search, context compression, re-ranking, gold boost
- [ ] PostgreSQL `architecture_docs` table is truncated (after backup)
- [ ] Browser quantized assets rebuild automatically when RVF is newer

---

## Quality Scorecard

Current state (estimated) vs target after all phases:

| Dimension | Current | Target | Measured By |
|-----------|---------|--------|-------------|
| Diagram inclusion rate | ~50% | >90% | 10 architecture queries, check for mermaid blocks |
| Table inclusion rate | ~60% | >90% | 10 comparison queries, check for pipe-delimited tables |
| Source citations per response | 0 | 3+ | Count `[Source N]` occurrences in 10 responses |
| Confidence indicator coverage | 0% | 100% | Every response shows green/yellow/red badge |
| Context chars per query | ~4,000 | ~12,000 | Log `context.length` for 10 queries |
| BM25 coverage | 50K | 100K+ | `hybridSearch.getStats().totalDocuments` |
| Follow-up relevance | Keyword-generic | Context-specific | Manual review of 10 follow-up sets |
| /health subsystem coverage | 0 checks | 3 checks | Hit `/health`, verify 3 subsystem statuses |
| RAG pipeline test coverage | 0 tests | 15+ tests | `npm run test:rag` assertion count |
| Startup validation | None | RVF+sidecar count check | Server logs on startup |

---

## Risk Notes

1. **H-1 (ResponseValidator)** is the highest-impact and highest-complexity item. If the secondary LLM call for missing elements adds unacceptable latency (>3s), fall back to a simpler approach: append a stronger instruction to the system prompt ("FAILURE TO INCLUDE A MERMAID DIAGRAM WILL RESULT IN AN INCOMPLETE RESPONSE") and rely on prompt engineering alone.

2. **C-2 (shared RAG pipeline)** is a refactoring that touches the most critical code path. Test thoroughly with both endpoints after extraction. Ensure error handling in the streaming path still sends SSE error events correctly.

3. **H-2 (context limits)** increases token usage per request. Monitor LLM costs after deployment. If costs increase significantly, reduce back to 20,000 chars and focus optimization on source selection quality rather than quantity.

4. **H-4 (inline citations)** requires the LLM to reliably include `[Source N]` markers. Some models in the fallback chain (especially older Groq models) may ignore this instruction. Test with each provider in the chain.

---

## Files Summary

| File | Changes |
|------|---------|
| `/src/server/app.js` | C-2 refactor, C-3 key removal, M-3 health, M-6 BM25 cap, H-2 compression config |
| `/src/core/RvfStore.js` | C-1 startup validation |
| `/src/core/ContextCompressor.js` | H-2 limit increase, H-4 numbered source formatting |
| `/src/core/ResponseValidator.js` | H-1 (new file) |
| `/src/server/RuvPersona.js` | H-4 citation instructions |
| `/src/ui/src/App.jsx` | H-3 follow-ups, M-1 Quick Actions, M-2 tooltips, M-4 confidence display |
| `/src/ui/src/App.css` | M-2 tooltip styles, M-4 confidence indicator styles |
| `/tests/rag-pipeline.test.js` | M-7 (new file) |
| `.gitignore` | H-5 split file patterns |
| Root cleanup | H-5, L-3, L-4 file deletions |
