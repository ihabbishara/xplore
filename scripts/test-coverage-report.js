#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COVERAGE_THRESHOLD = 80;

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

// Get coverage data from a specific app
function getCoverageData(appPath) {
  const coveragePath = path.join(appPath, 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    return null;
  }
  
  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  return coverageData.total;
}

// Format percentage with color
function formatPercentage(value, threshold) {
  const percentage = value.toFixed(2);
  const color = value >= threshold ? colors.green : colors.red;
  return `${color}${percentage}%${colors.reset}`;
}

// Generate coverage report
function generateReport() {
  console.log('\n📊 Test Coverage Report\n');
  console.log('═'.repeat(60));
  
  const apps = ['api', 'web'];
  const results = {};
  let allPassed = true;
  
  for (const app of apps) {
    const appPath = path.join(__dirname, '..', 'apps', app);
    const coverage = getCoverageData(appPath);
    
    if (!coverage) {
      console.log(`\n${colors.yellow}⚠️  No coverage data found for ${app}${colors.reset}`);
      console.log(`   Run: cd apps/${app} && pnpm test:coverage\n`);
      continue;
    }
    
    results[app] = coverage;
    
    console.log(`\n${colors.blue}📦 ${app.toUpperCase()}${colors.reset}`);
    console.log('─'.repeat(30));
    
    const metrics = ['lines', 'statements', 'functions', 'branches'];
    
    for (const metric of metrics) {
      const value = coverage[metric].pct;
      const covered = coverage[metric].covered;
      const total = coverage[metric].total;
      const passed = value >= COVERAGE_THRESHOLD;
      
      if (!passed) allPassed = false;
      
      const icon = passed ? '✅' : '❌';
      const percentage = formatPercentage(value, COVERAGE_THRESHOLD);
      
      console.log(
        `${icon} ${metric.padEnd(12)} ${percentage.padStart(8)} ` +
        `(${covered}/${total})`
      );
    }
  }
  
  // Overall summary
  console.log('\n═'.repeat(60));
  
  if (Object.keys(results).length === 0) {
    console.log(`\n${colors.red}❌ No test coverage data available${colors.reset}`);
    console.log('\nRun tests with coverage first:');
    console.log('  pnpm test:coverage\n');
    process.exit(1);
  }
  
  if (allPassed) {
    console.log(`\n${colors.green}✅ All coverage thresholds met (>= ${COVERAGE_THRESHOLD}%)${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}❌ Some coverage thresholds not met (< ${COVERAGE_THRESHOLD}%)${colors.reset}`);
    console.log('\nTo improve coverage:');
    console.log('  1. Add more unit tests for uncovered code');
    console.log('  2. Test edge cases and error scenarios');
    console.log('  3. Ensure all branches are tested\n');
    process.exit(1);
  }
  
  // Generate combined coverage badge
  const apiLines = results.api?.lines?.pct || 0;
  const webLines = results.web?.lines?.pct || 0;
  const overallCoverage = ((apiLines + webLines) / 2).toFixed(2);
  
  console.log(`\n📈 Overall Coverage: ${formatPercentage(overallCoverage, COVERAGE_THRESHOLD)}\n`);
}

// Main execution
try {
  generateReport();
} catch (error) {
  console.error(`\n${colors.red}Error generating coverage report:${colors.reset}`, error.message);
  process.exit(1);
}