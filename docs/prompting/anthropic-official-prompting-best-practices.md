# Anthropic Official: Claude Prompting Best Practices
Source: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
Retrieved: 2026-03-17
Applies to: Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5

## Model IDs
- Claude Opus 4.6: `claude-opus-4-6`
- Claude Sonnet 4.6: `claude-sonnet-4-6`
- Claude Haiku 4.5: `claude-haiku-4-5-20251001`

## General Principles

### Be Clear and Direct
- Be specific about desired output format and constraints
- Use numbered lists for sequential steps
- Think of Claude as "a brilliant but new employee who lacks context"
- Golden rule: if a colleague with minimal context would be confused, Claude will be too

### Add Context to Improve Performance
- Explain WHY behind instructions (e.g., "text-to-speech will read this" instead of just "no ellipses")
- Claude generalizes from explanations

### Use Examples Effectively (Few-Shot)
- 3-5 examples for best results
- Make examples: relevant, diverse, structured
- Wrap in `<example>` tags to distinguish from instructions

### Structure Prompts with XML Tags
- Use `<instructions>`, `<context>`, `<input>` etc.
- Nest tags for natural hierarchies
- Consistent, descriptive tag names

### Give Claude a Role
```python
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=1024,
    system="You are a helpful coding assistant specializing in Python.",
    messages=[{"role": "user", "content": "..."}],
)
```

### Long Context Prompting (20K+ tokens)
- Put longform data at TOP, queries at BOTTOM (up to 30% quality improvement)
- Use `<document>` tags with `<source>` metadata
- Ask Claude to quote relevant parts before answering

### Model Self-Knowledge
```
The assistant is Claude, created by Anthropic. The current model is Claude Opus 4.6.
When an LLM is needed, default to Claude Opus 4.6. Model string: claude-opus-4-6.
```

## Output and Formatting

### Claude 4.6 Communication Style
- More direct and grounded
- More conversational, less machine-like
- Less verbose — may skip summaries unless prompted
- May skip verbal summaries after tool calls

### Control Format
1. Tell Claude what TO DO (not what not to do)
2. Use XML format indicators (`<smoothly_flowing_prose_paragraphs>`)
3. Match prompt style to desired output style
4. Provide explicit formatting guidance

### LaTeX
- Opus 4.6 defaults to LaTeX for math
- Add "Format in plain text only" to disable

### Document Creation
- Models excel at presentations, animations, visual documents
- Produce polished output on first try
- Be explicit about design elements desired

### Prefilled Responses DEPRECATED
- Starting with Claude 4.6, prefills on last assistant turn no longer supported
- Use structured outputs, XML tags, or direct instructions instead
- For continuations: "Your previous response ended with `[text]`. Continue from there."

## Tool Use

### Be Explicit About Actions
- "Change this function" not "Can you suggest changes?"
- For proactive action: use `<default_to_action>` tag
- For conservative: use `<do_not_act_before_instructions>` tag

### Claude 4.6 is More Responsive to System Prompts
- May OVERTRIGGER on instructions that were needed for older models
- Dial back aggressive language ("CRITICAL: You MUST" → "Use this tool when...")

### Parallel Tool Calling
- Claude 4.6 excels at parallel execution
- Use `<use_parallel_tool_calls>` guidance for ~100% parallel rate
- Can bottleneck system performance from excessive parallelism

## Thinking and Reasoning

### Adaptive Thinking (NEW in 4.6)
```python
client.messages.create(
    model="claude-opus-4-6",
    max_tokens=64000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": "..."}],
)
```
- Opus 4.6 uses adaptive thinking by default
- Claude dynamically decides when and how much to think
- Better performance than manual extended thinking in evaluations

### Effort Settings
- `max` — most thorough
- `high` — recommended for complex tasks
- `medium` — balanced (default for Sonnet 4.6)
- `low` — fast, latency-sensitive

### Overthinking Prevention
- Replace "Default to using [tool]" with "Use [tool] when it would enhance understanding"
- Remove over-prompting that causes overtriggering
- "Choose an approach and commit to it. Avoid revisiting decisions unless contradicted."

## Agentic Systems

### Long-Horizon Reasoning
- Exceptional state tracking across extended sessions
- Context awareness: Claude tracks remaining token budget
- For compacting agents: "Do not stop tasks early due to token budget concerns"

### Multi-Context Window Workflows
1. First window: set up framework (tests, scripts)
2. Future windows: iterate on todo-list
3. Have model write tests in structured format (tests.json)
4. Create setup scripts (init.sh) for fresh context starts
5. Start fresh rather than compact (Claude discovers state from filesystem)

### Balancing Autonomy and Safety
- "Consider reversibility and potential impact"
- Local/reversible actions: proceed freely
- Destructive/shared/visible actions: ask first
- "Do not bypass safety checks as a shortcut"

### Research and Information Gathering
- Provide clear success criteria
- Encourage source verification
- Use competing hypotheses approach
- Track confidence levels

### Subagent Orchestration
- Claude 4.6 naturally delegates to subagents
- May over-spawn subagents (add guidance about when NOT to use them)
- "Use subagents for parallel/isolated tasks. Work directly for simple/sequential tasks."

### Overengineering Prevention
```
Avoid over-engineering. Only make changes directly requested or clearly necessary.
- Don't add features beyond what was asked
- Don't add docstrings to code you didn't change
- Don't add error handling for impossible scenarios
- Don't create abstractions for one-time operations
```

### Anti-Hallucination for Agentic Coding
```
<investigate_before_answering>
Never speculate about code you have not opened. Read the file before answering.
Investigate relevant files BEFORE answering questions about the codebase.
</investigate_before_answering>
```

## Migration to Claude 4.6

### Key Changes
1. Be specific about desired behavior (more explicit = better)
2. Use modifiers for quality ("Include as many relevant features as possible")
3. Request animations/interactive elements explicitly
4. Use adaptive thinking instead of budget_tokens
5. Migrate away from prefilled responses
6. Tune anti-laziness prompting DOWN (4.6 is more proactive)

### Recommended Sonnet 4.6 Effort Settings
- **Medium** for most applications
- **Low** for high-volume/latency-sensitive
- Set max_tokens to 64k at medium/high effort
- Use Opus 4.6 for hardest, longest-horizon problems

### When to Use Adaptive Thinking
- Autonomous multi-step agents
- Computer use agents
- Bimodal workloads (mix of easy/hard)

## Frontend Design
```
<frontend_aesthetics>
Avoid generic "AI slop" aesthetic. Make creative, distinctive frontends.
Focus on:
- Typography: Beautiful, unique fonts (NOT Arial, Inter, Roboto)
- Color: Cohesive aesthetic with sharp accents, CSS variables
- Motion: Animations for effects, staggered reveals
- Backgrounds: Atmosphere and depth, not solid colors
Vary between light/dark, different fonts, different aesthetics.
</frontend_aesthetics>
```

## Vision Capabilities
- Improved multi-image processing
- Better screenshot/UI interpretation
- Crop tool provides uplift on image evaluations
- Can analyze videos via frame extraction
