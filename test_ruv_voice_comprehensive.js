const axios = require('axios');
const fs = require('fs');

const API_URL = process.env.API_URL || 'https://ask-ruvnet-production.up.railway.app';

const TEST_QUESTIONS = [
    // Voice/Personality Tests
    {
        category: "Voice - Conversational",
        question: "Hey Ruv, I'm trying to set up a multi-agent system but I keep crashing my Codespace. Any tips?",
        expectVoice: ["All right", "So", "Works for me", "doable", "genius move", "cool"],
        expectTech: false
    },
    {
        category: "Voice - Encouragement",
        question: "I'm stuck on implementing semantic memory. Is this even possible for a beginner?",
        expectVoice: ["totally doable", "you can", "love this", "interesting", "cool", "genius"],
        expectTech: false
    },

    // Technical + Command Syntax Tests
    {
        category: "Technical - Claude Flow",
        question: "How do I install and set up Claude Flow?",
        expectVoice: ["All right", "genius move"],
        expectTech: true,
        expectCommands: ["npm", "install", "claude-flow"],
        expectGitHub: true
    },
    {
        category: "Technical - Ruvector",
        question: "What's the exact syntax for initializing Ruvector with embeddings?",
        expectVoice: ["Let me show you"],
        expectTech: true,
        expectCommands: ["new", "Ruvector", "embeddings"],
        expectGitHub: true
    },
    {
        category: "Technical - AgentDB",
        question: "How do I set up AgentDB for graph-based memory?",
        expectVoice: ["cool part"],
        expectTech: true,
        expectCommands: ["AgentDB", "graph"],
        expectGitHub: true
    },
    {
        category: "Technical - MCP Servers",
        question: "What commands do I need to start an MCP server?",
        expectVoice: ["doable"],
        expectTech: true,
        expectCommands: ["mcp", "server", "start"],
        expectGitHub: true
    },
    {
        category: "Technical - Multi-Agent",
        question: "Show me the code for coordinating multiple agents",
        expectVoice: ["gonna love"],
        expectTech: true,
        expectCommands: ["agent", "coordinate"],
        expectGitHub: true
    },

    // Architecture Questions
    {
        category: "Architecture - Agentic Flow",
        question: "How does Agentic Flow's reasoning bank actually work?",
        expectVoice: ["interesting"],
        expectTech: true,
        expectGitHub: false
    },
    {
        category: "Architecture - Vector DB",
        question: "Why use Ruvector instead of Pinecone or Weaviate?",
        expectVoice: ["genius move", "cool"],
        expectTech: true,
        expectGitHub: false
    },
    {
        category: "Practical - Deployment",
        question: "I want to deploy this to Railway. Walk me through it.",
        expectVoice: ["All right", "So"],
        expectTech: true,
        expectCommands: ["railway", "deploy"],
        expectGitHub: false
    }
];

async function testVoiceAndTech() {
    console.log('🧪 COMPREHENSIVE TEST: Ruv\'s Voice + Technical Accuracy');
    console.log('='.repeat(80));
    console.log(`Testing against: ${API_URL}`);
    console.log('='.repeat(80));
    console.log('');

    const results = {
        total: TEST_QUESTIONS.length,
        voicePassed: 0,
        techPassed: 0,
        commandsPassed: 0,
        githubPassed: 0,
        details: []
    };

    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
        const test = TEST_QUESTIONS[i];
        console.log(`\n[${'='.repeat(78)}]`);
        console.log(`TEST ${i + 1}/${TEST_QUESTIONS.length}: ${test.category}`);
        console.log(`[${'='.repeat(78)}]`);
        console.log(`Q: ${test.question}`);
        console.log('');

        try {
            const startTime = Date.now();
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: test.question,
                history: []
            }, { timeout: 60000 }); // Increased timeout for production
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            const answer = response.data.response || response.data.answer || '';
            const error = response.data.error;
            const sources = response.data.sources || [];

            console.log(`⏱️  Time: ${duration.toFixed(2)}s`);
            if (error) {
                console.log(`❌ ERROR from Server: ${error}`);
            }
            console.log(`📝 Response (${answer.length} chars):`);
            console.log('-'.repeat(80));
            console.log(answer);
            console.log('-'.repeat(80));

            // Test Voice
            let voiceScore = 0;
            if (test.expectVoice) {
                const foundPhrases = test.expectVoice.filter(phrase =>
                    answer.toLowerCase().includes(phrase.toLowerCase())
                );
                voiceScore = foundPhrases.length / test.expectVoice.length;

                console.log(`\n🎤 VOICE CHECK:`);
                console.log(`   Expected phrases: ${test.expectVoice.join(', ')}`);
                console.log(`   Found: ${foundPhrases.join(', ') || 'none'}`);
                console.log(`   Score: ${(voiceScore * 100).toFixed(0)}%`);

                if (voiceScore >= 0.3) { // At least 30% of expected phrases
                    results.voicePassed++;
                    console.log(`   ✅ PASS`);
                } else {
                    console.log(`   ❌ FAIL - Not enough Ruv-like phrases`);
                }
            }

            // Test Technical Content
            if (test.expectTech) {
                const hasTechnicalDepth = answer.length > 200 &&
                    (answer.includes('```') || answer.includes('code') || answer.includes('example'));

                console.log(`\n🔧 TECHNICAL CHECK:`);
                console.log(`   Has depth: ${answer.length} chars`);
                console.log(`   Has code examples: ${answer.includes('```')}`);

                if (hasTechnicalDepth) {
                    results.techPassed++;
                    console.log(`   ✅ PASS`);
                } else {
                    console.log(`   ❌ FAIL - Needs more technical depth`);
                }
            }

            // Test Commands
            if (test.expectCommands) {
                const foundCommands = test.expectCommands.filter(cmd =>
                    answer.toLowerCase().includes(cmd.toLowerCase())
                );

                console.log(`\n⚙️  COMMAND SYNTAX CHECK:`);
                console.log(`   Expected commands: ${test.expectCommands.join(', ')}`);
                console.log(`   Found: ${foundCommands.join(', ') || 'none'}`);

                if (foundCommands.length >= test.expectCommands.length * 0.5) {
                    results.commandsPassed++;
                    console.log(`   ✅ PASS`);
                } else {
                    console.log(`   ❌ FAIL - Missing command examples`);
                }
            }

            // Test GitHub References
            if (test.expectGitHub) {
                const hasGitHubRef = answer.includes('github') || answer.includes('repo') ||
                    sources.some(s => s.source && s.source.includes('github'));

                console.log(`\n🔗 GITHUB REFERENCE CHECK:`);
                console.log(`   Has GitHub reference: ${hasGitHubRef}`);
                console.log(`   Sources: ${sources.length}`);

                if (hasGitHubRef || sources.length > 0) {
                    results.githubPassed++;
                    console.log(`   ✅ PASS`);
                } else {
                    console.log(`   ⚠️  WARNING - No GitHub/source references`);
                }
            }

            results.details.push({
                question: test.question,
                category: test.category,
                voiceScore,
                passed: voiceScore >= 0.3
            });

        } catch (error) {
            console.log(`\n❌ ERROR: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
            }
        }

        // Wait to avoid rate limits
        console.log('Waiting 5s...');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(80));
    console.log(`Voice Tests: ${results.voicePassed}/${results.total} (${(results.voicePassed / results.total * 100).toFixed(0)}%)`);
    console.log(`Technical Tests: ${results.techPassed}/${TEST_QUESTIONS.filter(t => t.expectTech).length}`);
    console.log(`Command Tests: ${results.commandsPassed}/${TEST_QUESTIONS.filter(t => t.expectCommands).length}`);
    console.log(`GitHub Tests: ${results.githubPassed}/${TEST_QUESTIONS.filter(t => t.expectGitHub).length}`);
    console.log('');

    const overallScore = results.voicePassed / results.total;

    if (overallScore >= 0.7) {
        console.log('✅ SUCCESS: Voice is authentic!');
    } else {
        console.log('⚠️  NEEDS IMPROVEMENT: Voice needs tuning');
    }

    console.log('='.repeat(80));

    // Save results
    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved to: test_results.json');
}

testVoiceAndTech().catch(console.error);
