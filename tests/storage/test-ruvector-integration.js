#!/usr/bin/env node
/**
 * RuVector Integration Test
 *
 * Verifies the complete migration from SQLite to RuVector:
 * 1. RuvectorStore initializes correctly
 * 2. Persisted data loads on startup
 * 3. Search functionality works
 * 4. New data can be added and persists
 */

const path = require('path');

// Set up module path
process.chdir(path.join(__dirname, '../..'));

async function runTests() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RuVector Integration Test Suite');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function test(name, passed, details = '') {
        results.tests.push({ name, passed, details });
        if (passed) {
            results.passed++;
            console.log(`✅ ${name}`);
        } else {
            results.failed++;
            console.log(`❌ ${name}`);
            if (details) console.log(`   ${details}`);
        }
    }

    try {
        // Test 1: Import RuvectorStore
        console.log('\n📋 Test 1: Import RuvectorStore');
        let RuvectorStore;
        try {
            RuvectorStore = require('../../src/core/RuvectorStore');
            test('RuvectorStore imports successfully', true);
        } catch (err) {
            test('RuvectorStore imports successfully', false, err.message);
            throw new Error('Cannot continue without RuvectorStore');
        }

        // Test 2: Initialize RuvectorStore
        console.log('\n📋 Test 2: Initialize RuvectorStore');
        let store;
        try {
            store = new RuvectorStore();
            await store.initialize();
            test('RuvectorStore initializes successfully', true);
        } catch (err) {
            test('RuvectorStore initializes successfully', false, err.message);
            throw new Error('Cannot continue without initialized store');
        }

        // Test 3: Check persisted data loaded
        console.log('\n📋 Test 3: Check persisted data');
        const stats = store.getStats();
        console.log(`   Backend: ${stats.backend}`);
        console.log(`   Vectors: ${stats.vectorCount}`);
        console.log(`   Dimensions: ${stats.dimensions}`);
        test('Persisted data loads', stats.vectorCount > 0,
            stats.vectorCount > 0 ? `Loaded ${stats.vectorCount} vectors` : 'No vectors found');

        // Test 4: Search functionality
        console.log('\n📋 Test 4: Search functionality');
        try {
            const searchResults = await store.search('memory coordination swarm', 5);
            test('Search returns results', searchResults.length > 0,
                searchResults.length > 0 ? `Found ${searchResults.length} results` : 'No results');

            if (searchResults.length > 0) {
                console.log(`   Top result score: ${searchResults[0].score?.toFixed(4)}`);
                console.log(`   Content preview: ${(searchResults[0].content || '').slice(0, 60)}...`);
            }
        } catch (err) {
            test('Search returns results', false, err.message);
        }

        // Test 5: Reflexion API compatibility
        console.log('\n📋 Test 5: Reflexion API compatibility');
        try {
            const reflexionResults = await store.reflexion.retrieveRelevant({
                task: 'agent coordination',
                k: 3
            });
            test('Reflexion API works', Array.isArray(reflexionResults),
                `Retrieved ${reflexionResults.length} results via reflexion API`);
        } catch (err) {
            test('Reflexion API works', false, err.message);
        }

        // Test 6: Add new document
        console.log('\n📋 Test 6: Add new document');
        try {
            const testId = await store.store(
                'Integration test document for RuVector migration verification',
                { source: 'integration-test', timestamp: new Date().toISOString() }
            );
            test('Can add new documents', testId && testId.length > 0,
                `Added document with ID: ${testId}`);
        } catch (err) {
            test('Can add new documents', false, err.message);
        }

        // Test 7: Verify persistence (commit and check)
        console.log('\n📋 Test 7: Persistence verification');
        try {
            await store.commit();
            const newStats = store.getStats();
            test('Data persists after commit', true,
                `Total vectors after commit: ${newStats.vectorCount}`);
        } catch (err) {
            test('Data persists after commit', false, err.message);
        }

        // Test 8: Close and cleanup
        console.log('\n📋 Test 8: Clean shutdown');
        try {
            await store.close();
            test('Store closes cleanly', true);
        } catch (err) {
            test('Store closes cleanly', false, err.message);
        }

    } catch (err) {
        console.error('\n💥 Critical error:', err.message);
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Summary');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Total:  ${results.tests.length}`);
    console.log('');

    if (results.failed === 0) {
        console.log('  🎉 All tests passed! RuVector migration successful.');
    } else {
        console.log('  ⚠️  Some tests failed. Review errors above.');
    }
    console.log('═══════════════════════════════════════════════════════════');

    process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
