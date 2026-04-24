import { execSync } from 'child_process';

console.log('Running preservation tests from Task 2...');

try {
  // Run BasicPreservation tests
  console.log('\n=== Running BasicPreservation.test.jsx ===');
  execSync('npx vitest run src/components/courtroom/BasicPreservation.test.jsx', { 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('✅ BasicPreservation tests PASSED');
} catch (error) {
  console.log('❌ BasicPreservation tests FAILED');
  console.log('Error:', error.message);
}

try {
  // Run PreservationProperty tests
  console.log('\n=== Running PreservationProperty.test.jsx ===');
  execSync('npx vitest run src/components/courtroom/PreservationProperty.test.jsx', { 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('✅ PreservationProperty tests PASSED');
} catch (error) {
  console.log('❌ PreservationProperty tests FAILED');
  console.log('Error:', error.message);
}

try {
  // Run SimplePreservation tests
  console.log('\n=== Running SimplePreservation.test.jsx ===');
  execSync('npx vitest run src/components/courtroom/SimplePreservation.test.jsx', { 
    stdio: 'inherit',
    encoding: 'utf8'
  });
  console.log('✅ SimplePreservation tests PASSED');
} catch (error) {
  console.log('❌ SimplePreservation tests FAILED');
  console.log('Error:', error.message);
}

console.log('\n=== Preservation Tests Summary ===');
console.log('Task 3.7: Verify preservation tests still pass');
console.log('Re-running the SAME tests from Task 2 to confirm no regressions');