const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testKnowledgeBase() {
    console.log('🧪 Testing Knowledge Base Integration...\n');

    const testQueries = [
        {
            query: "What video content do you have about Ruv Coaching?",
            expected: "video_metadata"
        },
        {
            query: "What is the latest version of the Ask-Ruvnet repository?",
            expected: "repo_version"
        },
        {
            query: "What images have been processed?",
            expected: "image_ocr"
        }
    ];

    for (const test of testQueries) {
        console.log(`\n📝 Query: "${test.query}"`);
        console.log(`   Expected type: ${test.expected}`);
        console.log(`   Testing...`);

        try {
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: test.query,
                history: []
            });

            if (response.data && response.data.response) {
                console.log(`   ✅ Response received (${response.data.response.length} chars)`);

                // Check if sources are returned
                if (response.data.sources && response.data.sources.length > 0) {
                    console.log(`   ✅ Sources found: ${response.data.sources.length}`);
                    response.data.sources.forEach((source, i) => {
                        console.log(`      Source ${i + 1}: ${source.source || source.id} (score: ${source.score?.toFixed(2) || 'N/A'})`);
                    });
                } else {
                    console.log(`   ⚠️  No sources returned`);
                }

                // Show snippet of response
                const snippet = response.data.response.substring(0, 200);
                console.log(`   💬 Response snippet: "${snippet}..."`);
            } else {
                console.log(`   ❌ Invalid response format`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`      Status: ${error.response.status}`);
                console.log(`      Data: ${JSON.stringify(error.response.data)}`);
            }
        }
    }

    console.log('\n\n📊 Summary:');
    console.log('   If you see sources returned with video_metadata, repo_version, or image_ocr,');
    console.log('   then the knowledge base is successfully ingesting and retrieving data!');
}

testKnowledgeBase();
