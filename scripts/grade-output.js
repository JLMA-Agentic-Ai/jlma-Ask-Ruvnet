#!/usr/bin/env node
/**
 * Output Quality Grading System for Ask-RuvNet
 * Scores LLM responses across 8 dimensions on a 0-100 scale
 * Target: 98+/100 composite score
 */

const TEST_QUERIES = [
  { message: "What is Ruflo V3 and what makes it different from V2?", mode: "Balanced", intent: "what-is" },
  { message: "How do I install and configure RuVector for my PostgreSQL database?", mode: "Beginner", intent: "how-to" },
  { message: "Why did rUv choose HNSW over brute-force vector search, and what are the tradeoffs?", mode: "Technical", intent: "decision" },
  { message: "HNSW search is returning wrong results with low recall. How do I debug and fix it?", mode: "Technical", intent: "troubleshoot" },
  { message: "Show me an example of using ReasoningBank for self-learning in a multi-agent swarm", mode: "Balanced", intent: "example" },
];

const RUBRIC = {
  structure:        { weight: 15, desc: "Has TL;DR, Core, Architecture, Example, Watch For, Explore Further sections" },
  educational:      { weight: 20, desc: "Teaches effectively — analogies, progressive disclosure, clear explanations" },
  mermaid:          { weight: 10, desc: "Includes Mermaid diagram for architecture/workflow topics" },
  code_examples:    { weight: 10, desc: "Practical, runnable code examples with context" },
  accuracy:         { weight: 15, desc: "Grounded in KB context, no hallucinations, correct technical facts" },
  communication:    { weight: 10, desc: "Professional, clear, no filler, no stage directions, proper markdown" },
  options:          { weight: 10, desc: "Presents alternatives, tradeoffs, comparison tables when applicable" },
  actionability:    { weight: 10, desc: "Reader knows what to DO next — clear steps, explore further questions" },
};

function gradeResponse(answer, intent) {
  const scores = {};

  // Structure (15pts) — check for all required sections
  const hasSection = (pattern) => new RegExp(pattern, 'i').test(answer);
  let structScore = 0;
  if (hasSection('##\\s*TL;?DR')) structScore += 20;
  if (hasSection('##\\s*Core\\s*(Explanation|Concept)')) structScore += 20;
  if (hasSection('##\\s*(Architecture|How\\s*It\\s*Works)')) structScore += 20;
  if (hasSection('##\\s*Practical\\s*Example')) structScore += 15;
  if (hasSection('##\\s*What\\s*to\\s*Watch')) structScore += 15;
  if (hasSection('##\\s*Explore\\s*Further')) structScore += 10;
  scores.structure = Math.min(100, structScore);

  // Educational (20pts) — analogies, explanations, progressive depth
  let eduScore = 50; // baseline
  if (/like\s+a\s+|similar\s+to\s+|think\s+of\s+it\s+as|akin\s+to|much\s+like/i.test(answer)) eduScore += 15;
  if (/\*\*[A-Z].*?\*\*/g.test(answer)) eduScore += 10; // bold key terms
  if (answer.length > 2000) eduScore += 10; // sufficient depth
  if (/\d\.\s+\*\*|###\s+Step/i.test(answer)) eduScore += 10; // numbered steps
  if (/>\s+[A-Z]/m.test(answer) || /> \*\*/m.test(answer)) eduScore += 5; // blockquotes
  scores.educational = Math.min(100, eduScore);

  // Mermaid (10pts)
  const hasMermaid = /```mermaid[\s\S]*?```/.test(answer);
  const needsMermaid = ['what-is', 'how-to', 'decision', 'example'].includes(intent);
  scores.mermaid = hasMermaid ? 100 : (needsMermaid ? 30 : 70);

  // Code examples (10pts)
  const codeBlocks = (answer.match(/```(?:bash|javascript|typescript|sql|json)[\s\S]*?```/g) || []).length;
  scores.code_examples = codeBlocks >= 2 ? 100 : codeBlocks === 1 ? 75 : 30;

  // Accuracy (15pts) — no hallucination markers, grounded
  let accScore = 80; // baseline (can't fully verify without KB)
  if (/I don't have|I'm not sure|fabricat/i.test(answer)) accScore -= 20;
  if (/```mermaid[\s\S]*?```/.test(answer)) accScore += 5; // diagrams show understanding
  if (/v3|V3|3\.\d|version\s+3/i.test(answer) && intent === 'what-is') accScore += 10;
  if (/HNSW|hnsw/i.test(answer) && (intent === 'decision' || intent === 'troubleshoot')) accScore += 10;
  scores.accuracy = Math.min(100, accScore);

  // Communication (10pts)
  let commScore = 85;
  if (/gonna|wanna|pretty cool|trust me|All right so/i.test(answer)) commScore -= 30;
  if (/\(laughs\)|\(draws\)|\(types\)/i.test(answer)) commScore -= 30;
  if (/##\s+/.test(answer)) commScore += 5; // proper markdown headers
  if (/\|.*\|.*\|/m.test(answer)) commScore += 5; // tables
  if (answer.length > 1500 && answer.length < 6000) commScore += 5; // not too short, not too long
  scores.communication = Math.min(100, commScore);

  // Options/Tradeoffs (10pts)
  let optScore = 50;
  if (/\|.*\|.*\|[\s\S]*\|.*\|.*\|/m.test(answer)) optScore += 25; // comparison table
  if (/tradeoff|trade-off|alternatively|option|compare|versus|vs\./i.test(answer)) optScore += 15;
  if (/pros|cons|advantage|disadvantage|benefit|drawback/i.test(answer)) optScore += 10;
  scores.options = Math.min(100, optScore);

  // Actionability (10pts)
  let actScore = 50;
  if (/##\s*Explore\s*Further/i.test(answer)) actScore += 20;
  if (/##\s*Practical\s*Example/i.test(answer)) actScore += 15;
  if (/```(bash|javascript|sql)/i.test(answer)) actScore += 10;
  if (/npm\s+install|npx\s+|CREATE\s+|SELECT\s+/i.test(answer)) actScore += 5;
  scores.actionability = Math.min(100, actScore);

  // Compute weighted composite
  let composite = 0;
  let totalWeight = 0;
  for (const [key, { weight }] of Object.entries(RUBRIC)) {
    composite += (scores[key] / 100) * weight;
    totalWeight += weight;
  }
  const finalScore = Math.round((composite / totalWeight) * 100);

  return { scores, composite: finalScore };
}

async function main() {
  console.log("=== Ask-RuvNet Output Quality Grading ===\n");
  console.log(`Rubric: ${Object.entries(RUBRIC).map(([k, v]) => `${k}(${v.weight}%)`).join(', ')}\n`);

  const results = [];

  for (const query of TEST_QUERIES) {
    process.stdout.write(`Testing [${query.intent}] "${query.message.substring(0, 50)}..." `);

    try {
      const resp = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query.message, mode: query.mode }),
      });
      const data = await resp.json();

      const grade = gradeResponse(data.answer, query.intent);
      results.push({ ...query, provider: data.provider, answerLen: data.answer?.length, grade });

      console.log(`→ ${grade.composite}/100 (${data.provider}, ${data.answer?.length} chars)`);

      // Detail scores
      for (const [key, score] of Object.entries(grade.scores)) {
        const bar = '█'.repeat(Math.round(score / 5)) + '░'.repeat(20 - Math.round(score / 5));
        console.log(`  ${key.padEnd(16)} ${bar} ${score}/100`);
      }
      console.log('');
    } catch (err) {
      console.log(`→ ERROR: ${err.message}`);
      results.push({ ...query, grade: { composite: 0, scores: {} }, error: err.message });
    }
  }

  // Summary
  const validResults = results.filter(r => r.grade.composite > 0);
  const avgScore = Math.round(validResults.reduce((s, r) => s + r.grade.composite, 0) / validResults.length);

  console.log("=== SUMMARY ===");
  console.log(`Queries tested: ${results.length}`);
  console.log(`Provider: ${results[0]?.provider || 'unknown'}`);
  console.log(`Average composite: ${avgScore}/100`);
  console.log(`Min: ${Math.min(...validResults.map(r => r.grade.composite))}/100`);
  console.log(`Max: ${Math.max(...validResults.map(r => r.grade.composite))}/100`);

  // Per-dimension averages
  console.log("\nPer-dimension averages:");
  for (const dim of Object.keys(RUBRIC)) {
    const avg = Math.round(validResults.reduce((s, r) => s + (r.grade.scores[dim] || 0), 0) / validResults.length);
    const bar = '█'.repeat(Math.round(avg / 5)) + '░'.repeat(20 - Math.round(avg / 5));
    console.log(`  ${dim.padEnd(16)} ${bar} ${avg}/100 (weight: ${RUBRIC[dim].weight}%)`);
  }

  // Identify weakest dimensions
  const dimAvgs = Object.keys(RUBRIC).map(dim => ({
    dim,
    avg: Math.round(validResults.reduce((s, r) => s + (r.grade.scores[dim] || 0), 0) / validResults.length),
    weight: RUBRIC[dim].weight
  })).sort((a, b) => a.avg - b.avg);

  console.log("\nWeakest dimensions (focus for improvement):");
  dimAvgs.slice(0, 3).forEach(d => console.log(`  ⚠️  ${d.dim}: ${d.avg}/100 (${d.weight}% weight)`));

  console.log(`\n${avgScore >= 98 ? '✅ TARGET MET: 98+/100' : `❌ TARGET NOT MET: ${avgScore}/100 (need 98+)`}`);
}

main().catch(console.error);
