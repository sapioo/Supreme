#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('=== COMPREHENSIVE TEST STATUS CHECK ===\n');

const testFiles = [
  // Core spec tests
  'src/components/courtroom/BugConditionExploration.test.jsx',
  'src/components/courtroom/BasicPreservation.test.jsx',
  'src/components/courtroom/PreservationProperty.test.jsx',
  'src/components/courtroom/SimplePreservation.test.jsx',
  
  // Implementation tests
  'src/components/courtroom/NotificationSystem.test.jsx',
  'src/components/courtroom/NotificationIntegration.test.jsx',
  'src/components/courtroom/RoundCompletionFeedback.test.jsx',
  
  // Integration tests
  'src/components/courtroom/CourtroomArena.test.jsx',
  'src/test/voice-state-feedback.test.jsx',
  
  // Simple tests
  'src/test/simple.test.js',
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`Testing: ${testFile}`);
    
    const child = spawn('npx', ['vitest', 'run', testFile], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`  ✅ PASSED`);
      } else {
        console.log(`  ❌ FAILED (exit code: ${code})`);
        if (stderr && stderr.length > 0) {
          console.log(`  Error: ${stderr.slice(0, 150)}...`);
        }
      }
      resolve(code === 0);
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      child.kill();
      console.log(`  ⏰ TIMEOUT`);
      resolve(false);
    }, 15000);
  });
}

async function runAllTests() {
  const results = [];
  
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push({ file: testFile, passed: result });
    console.log(''); // Add spacing
  }
  
  console.log('=== FINAL TEST SUMMARY ===');
  
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  
  console.log(`\n✅ PASSED TESTS (${passed.length}):`);
  passed.forEach(({ file }) => {
    console.log(`  - ${file}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ FAILED TESTS (${failed.length}):`);
    failed.forEach(({ file }) => {
      console.log(`  - ${file}`);
    });
  }
  
  console.log(`\n=== OVERALL STATUS ===`);
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (failed.length === 0) {
    console.log(`\n🎉 ALL TESTS PASS! The implementation is complete and working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests are failing. This may be due to:`);
    console.log(`   - Import/dependency issues in test files`);
    console.log(`   - Missing components or services`);
    console.log(`   - Test environment configuration issues`);
  }
  
  return failed.length === 0;
}

runAllTests().then((success) => {
  process.exit(success ? 0 : 1);
});