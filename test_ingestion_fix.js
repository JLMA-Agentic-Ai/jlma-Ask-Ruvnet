// Note: agentic-flow is ESM, use dynamic import
const path = require('path');

async function test() {
    console.log('🧪 Testing HybridReasoningBank initialization...');
    try {
        const bankModule = await import('agentic-flow/reasoningbank');
        if (bankModule.initialize) {
            await bankModule.initialize();
        }

        const bank = new bankModule.HybridReasoningBank({
            preferWasm: false,
            dbPath: path.resolve(__dirname, '.test_memory.db')
        });

        console.log('✅ HybridReasoningBank initialized successfully!');
    } catch (error) {
        console.error('❌ Initialization FAILED:', error);
    }
}

test();
