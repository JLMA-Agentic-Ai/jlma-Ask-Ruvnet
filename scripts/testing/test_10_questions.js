#!/usr/bin/env node

// 10-Question Accuracy Test for Knowledge Base
const testQuestions = [
    "What is HybridReasoningBank?",
    "What is AgentDB used for?",
    "What is Ruvector?",
    "What is Ruflo?",
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
    console.log('🧪 Running 10-Question Accuracy Test\n');
    console.log('=' + '='.repeat(80) + '\n');

    for (let i = 0; i < testQuestions.length; i++) {
        const question = testQuestions[i];
        console.log(`\n📝 Question ${i + 1}/10: ${question}`);
        console.log('-'.repeat(80));

        try {
            const result = await testQuery(question);

            if (result.answer && !result.answer.includes("error")) {
                console.log(`✅ PASS - Got answer (${result.answer.length} chars)`);
                console.log(`📚 Sources: ${result.sources?.length || 0} documents retrieved`);
                if (result.sources && result.sources.length > 0) {
                    console.log(`   Top source: ${result.sources[0].id} (score: ${result.sources[0].score.toFixed(3)})`);
                }
            } else {
                console.log(`❌ FAIL - Error: ${result.answer || result.error}`);
            }
        } catch (error) {
            console.log(`❌ FAIL - Exception: ${error.message}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test Complete!');
}

runTests().catch(console.error);
