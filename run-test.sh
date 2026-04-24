#!/bin/bash
echo "Running BugConditionExploration test..."
npx vitest run src/components/courtroom/BugConditionExploration.test.jsx --reporter=verbose 2>&1 || echo "Test completed with exit code $?"