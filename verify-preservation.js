#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== Task 3.7: Verify preservation tests still pass ===');
console.log('Re-running the SAME tests from Task 2 to confirm no regressions\n');

const testFiles = [
  'src/components/courtroom/BasicPreservation.test.jsx',
  'src/components/courtroom/PreservationProperty.test.jsx', 
  'src/components/courtroom/SimplePreservation.test.jsx'
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`Running: ${testFile}`);
    
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
        console.log(`✅ ${testFile} - PASSED`);
        if (stdout.includes('PASS') || stdout.includes('✓')) {
          console.log('  Tests executed successfully');
        }
      } else {
        console.log(`❌ ${testFile} - FAILED (exit code: ${code})`);
        if (stderr) {
          console.log('  Error:', stderr.slice(0, 200));
        }
      }
      resolve(code === 0);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      console.log(`⏰ ${testFile} - TIMEOUT`);
      resolve(false);
    }, 30000);
  });
}

async function runAllTests() {
  const results = [];
  
  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push({ file: testFile, passed: result });
    console.log(''); // Add spacing
  }
  
  console.log('=== PRESERVATION TESTS SUMMARY ===');
  let allPassed = true;
  
  results.forEach(({ file, passed }) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${file}`);
    if (!passed) allPassed = false;
  });
  
  console.log('\n=== TASK 3.7 RESULT ===');
  if (allPassed) {
    console.log('✅ ALL PRESERVATION TESTS PASS - No regressions detected');
    console.log('The fix successfully preserves existing gameplay functionality');
  } else {
    console.log('❌ SOME PRESERVATION TESTS FAILED - Regressions detected');
    console.log('The fix may have broken existing functionality');
  }
  
  return allPassed;
}

runAllTests().then((success) => {
  process.exit(success ? 0 : 1);
});