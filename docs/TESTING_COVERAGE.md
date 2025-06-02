# Code Coverage Reporting

This document outlines the comprehensive code coverage reporting system implemented for the 209jobs application.

## Overview

The code coverage system uses Jest's built-in coverage collection with Istanbul to provide detailed insights into test coverage across the entire codebase.

## Coverage Configuration

### Jest Configuration
The coverage system is configured in `jest.config.js` with the following settings:

```javascript
collectCoverage: true,
coverageDirectory: 'coverage',
coverageReporters: ['text', 'lcov', 'html', 'json', 'clover'],
```

### Coverage Thresholds

We have implemented tiered coverage thresholds to ensure code quality:

#### Global Thresholds (70%)
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

#### Validation Files (80%)
Higher standards for critical validation logic:
- `src/lib/validations/**/*.ts`: 80% across all metrics

#### Component Files (60%)
Slightly lower threshold for UI components:
- `src/components/**/*.tsx`: 60% across all metrics

## Available Scripts

### Basic Coverage
```bash
npm run test:coverage
```
Runs all tests with coverage collection and displays results in terminal.

### Watch Mode Coverage
```bash
npm run test:coverage:watch
```
Runs coverage in watch mode, re-running tests when files change.

### Open Coverage Report
```bash
npm run test:coverage:open
```
Generates coverage report and opens the HTML report in your default browser.

## Coverage Reports

The system generates multiple report formats:

### 1. Terminal Output (`text`)
- Real-time coverage summary in the terminal
- Shows coverage percentages and uncovered line numbers
- Displays threshold violations

### 2. HTML Report (`html`)
- Interactive web-based coverage report
- Located at `coverage/index.html`
- Provides detailed file-by-file coverage analysis
- Highlights covered/uncovered lines with color coding

### 3. LCOV Report (`lcov`)
- Industry-standard coverage format
- Located at `coverage/lcov.info`
- Compatible with CI/CD systems and coverage services

### 4. JSON Report (`json`)
- Machine-readable coverage data
- Located at `coverage/coverage-final.json`
- Useful for programmatic analysis

### 5. Clover Report (`clover`)
- XML format coverage report
- Located at `coverage/clover.xml`
- Compatible with various CI/CD tools

## Coverage Collection

### Included Files
Coverage is collected from:
- `src/**/*.{js,jsx,ts,tsx}`
- All source files in the src directory

### Excluded Files
The following files are excluded from coverage:
- Test files (`**/*.{test,spec}.{js,jsx,ts,tsx}`)
- Test utilities (`src/__tests__/**`)
- Mock files (`**/__mocks__/**`)
- Configuration files (`**/*.config.{js,ts}`)
- Type definitions (`**/*.d.ts`)
- Build output (`**/.next/**`)
- Dependencies (`**/node_modules/**`)

## Understanding Coverage Metrics

### Statements Coverage
Percentage of executable statements that have been executed during tests.

### Branches Coverage
Percentage of conditional branches (if/else, switch cases) that have been executed.

### Functions Coverage
Percentage of functions that have been called during tests.

### Lines Coverage
Percentage of executable lines that have been executed during tests.

## Coverage Thresholds Enforcement

### Threshold Violations
When coverage falls below thresholds, Jest will:
1. Display detailed violation messages
2. Exit with a non-zero status code
3. Prevent CI/CD pipeline progression (if configured)

### Example Violation Output
```
Jest: "global" coverage threshold for statements (70%) not met: 65.2%
Jest: "src/lib/validations/api.ts" coverage threshold for statements (80%) not met: 45%
```

## Best Practices

### Writing Testable Code
1. Keep functions small and focused
2. Avoid complex nested conditions
3. Use dependency injection for external dependencies
4. Separate business logic from UI components

### Improving Coverage
1. **Identify Uncovered Code**: Use the HTML report to find uncovered lines
2. **Write Targeted Tests**: Focus on uncovered branches and functions
3. **Test Edge Cases**: Cover error conditions and boundary cases
4. **Mock External Dependencies**: Use mocks to test isolated units

### Coverage Goals
- **New Code**: Aim for 80%+ coverage on new features
- **Critical Paths**: Ensure 90%+ coverage for authentication, payments, data validation
- **UI Components**: Focus on user interactions and state changes
- **Utility Functions**: Aim for 100% coverage on pure functions

## Integration with CI/CD

### GitHub Actions
The coverage system integrates with CI/CD pipelines:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Coverage Services
Compatible with:
- Codecov
- Coveralls
- SonarQube
- Code Climate

## Troubleshooting

### Common Issues

#### Low Coverage Warnings
If you see many threshold violations:
1. Check if new files need tests
2. Verify test files are properly named (`.test.` or `.spec.`)
3. Ensure tests are actually testing the intended code paths

#### Coverage Not Updating
1. Clear Jest cache: `npx jest --clearCache`
2. Delete coverage directory: `rm -rf coverage`
3. Run tests again: `npm run test:coverage`

#### Performance Issues
If coverage collection is slow:
1. Use `--maxWorkers=50%` to limit parallel workers
2. Exclude unnecessary files from coverage collection
3. Run coverage only on changed files in development

## Monitoring Coverage Trends

### Regular Reviews
1. **Weekly**: Review coverage reports for new code
2. **Monthly**: Analyze coverage trends and set improvement goals
3. **Release**: Ensure coverage thresholds are met before deployment

### Coverage Metrics to Track
- Overall coverage percentage
- Coverage trend over time
- Files with lowest coverage
- Uncovered critical paths

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Testing**: Integrate performance metrics with coverage
3. **Mutation Testing**: Add mutation testing for test quality assessment
4. **Coverage Badges**: Add coverage badges to README
5. **Automated Reports**: Generate coverage reports in PR comments

### Advanced Configuration
Consider implementing:
- Branch-specific coverage requirements
- File-specific coverage targets
- Coverage diff reporting
- Integration with code review tools

## Resources

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Istanbul Coverage Reports](https://istanbul.js.org/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 