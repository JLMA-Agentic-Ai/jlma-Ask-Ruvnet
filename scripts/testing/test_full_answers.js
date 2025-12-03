#!/usr/bin/env node

// 10-Question Accuracy Test - WITH FULL ANSWERS
const testQuestions = [
    "What is HybridReasoningBank?",
    "What is AgentDB used for?",
    "What is Ruvector?",
    "What is Claude Flow?",
    "What tools does Ruv use for agentic coding?",
    "How does semantic search work in the knowledge base?",
    "What is the purpose of graph-based memory?",
    "What models are mentioned in the coaching sessions?",
    "What programming languages are discussed?",
    "What is the role of embeddings in the system?"
];

async function testQuery(question) {
    const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question })
    });
    return await response.json();
}

async function runTests() {
    console.log('🧪 FULL ANSWER TEST - Knowledge Base Quality Check\n');
    console.log('=' + '='.repeat(100) + '\n');

    let passCount = 0;
    const results = [];

    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n📝 QUESTION ${i + 1}/10: ${question}`);
        console.log('='.repeat(100));

        try {
            const result = await testQuery(question);

            if (result.answer && !result.answer.includes("error")) {
                passCount++;
                console.log(`\n✅ ANSWER:\n${result.answer}\n`);
                console.log(`\n📚 SOURCES USED (${result.sources?.length || 0} documents):`);
                if (result.sources && result.sources.length > 0) {
                    result.sources.forEach((src, idx) => {
                        console.log(`   ${idx + 1}. ${src.id} - Score: ${src.score.toFixed(3)}`);
                        console.log(`      Preview: ${src.content.substring(0, 150).replace(/\n/g, ' ')}...`);
                    });
                }

                results.push({
                    question,
                    passed: true,
                    answerLength: result.answer.length,
                    sourcesCount: result.sources?.length || 0,
                    topScore: result.sources?.[0]?.score || 0
                });
            } else {
                console.log(`\n❌ FAILED - Error: ${result.answer || result.error}`);
                results.push({ question, passed: false });
            }
        } catch (error) {
            console.log(`\n❌ FAILED - Exception: ${error.message}`);
            results.push({ question, passed: false });
        }

        console.log('\n' + '-'.repeat(100));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(100));
    console.log('\n📊 FINAL RESULTS:');
    console.log(`   ✅ Passed: ${passCount}/10 (${(passCount / 10 * 100).toFixed(0)}%)`);
    console.log(`   ❌ Failed: ${10 - passCount}/10`);

    console.log('\n📈 QUALITY METRICS:');
    const avgAnswerLength = results.filter(r => r.passed).reduce((sum, r) => sum + r.answerLength, 0) / passCount;
    const avgSourceCount = results.filter(r => r.passed).reduce((sum, r) => sum + r.sourcesCount, 0) / passCount;
    const avgTopScore = results.filter(r => r.passed).reduce((sum, r) => sum + r.topScore, 0) / passCount;

    console.log(`   Average Answer Length: ${Math.round(avgAnswerLength)} characters`);
    console.log(`   Average Sources Retrieved: ${avgSourceCount.toFixed(1)} documents per query`);
    console.log(`   Average Relevance Score: ${avgTopScore.toFixed(3)}`);

    console.log('\n' + '='.repeat(100));
    console.log(passCount === 10 ? '✅ 100% RECALL CONFIRMED!' : '⚠️  Recall incomplete');
}

runTests().catch(console.error);
