import { execSync } from 'child_process';

try {
  console.log('Running BugConditionExploration test...');
  const result = execSync('npx vitest run src/components/courtroom/BugConditionExploration.test.jsx --reporter=verbose', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Test output:', result);
} catch (error) {
  console.log('Test failed with error:', error.message);
  console.log('Stdout:', error.stdout);
  console.log('Stderr:', error.stderr);
}