# Test Command for Next.js Project

## Usage
```
/run-test [test-type] [test-name]
```

## Test Command Execution

### Primary Test Command
- `/run-test` → Execute full test suite based on current test setup

### Test Type Options
```bash
/run-test                    # Run all tests if available
/run-test unit              # Run unit tests
/run-test integration       # Run integration tests
/run-test e2e               # Run end-to-end tests (Playwright)
/run-test api               # Run API route tests
/run-test component         # Run component tests
/run-test <test-name>       # Run specific test file or pattern
```

### Test Command Implementation
```typescript
// Command execution logic:
1. Check if test framework is configured (Jest/Vitest/Playwright)
2. If no tests exist yet, suggest setting up testing framework
3. Execute appropriate npm script based on test type
4. Report test results and coverage if available
```

## Current Test Setup Status

### Package.json Test Scripts (Current)
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Missing Test Configuration
- ❌ No test scripts in package.json
- ❌ No Jest/Vitest configuration
- ❌ No Playwright configuration
- ❌ No testing libraries installed
- ❌ No test files exist yet

## Recommended Test Setup

### 1. Install Testing Dependencies
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest jest-environment-jsdom ts-jest
npm install -D @playwright/test  # For E2E tests
```

### 2. Add Test Scripts to package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:api": "jest --testPathPattern=api",
    "test:component": "jest --testPathPattern=components"
  }
}
```

### 3. Create Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
}
```

### 4. Create jest.setup.js
```javascript
import '@testing-library/jest-dom'
```

## Test Organization Structure

### Recommended Directory Layout
```
mmv-tarots/
├── app/
│   ├── api/
│   │   └── __tests__/          # API route tests
│   └── __tests__/              # Page/layout tests
├── components/
│   └── __tests__/              # Component tests
├── lib/
│   └── __tests__/              # Utility tests
├── __tests__/                  # Integration tests
├── e2e/                        # Playwright E2E tests
└── coverage/                   # Coverage reports
```

### Test File Naming Conventions
- `*.test.ts` or `*.test.tsx` - Unit/integration tests
- `*.spec.ts` or `*.spec.tsx` - Specification tests
- `__tests__/` directory - Co-located tests
- `e2e/` directory - End-to-end tests

## Test Examples

### API Route Test
```typescript
// app/api/predict/__tests__/route.test.ts
import { POST, GET } from '../route'

describe('/api/predict', () => {
  test('POST creates prediction', async () => {
    const request = new Request('http://localhost/api/predict', {
      method: 'POST',
      body: JSON.stringify({ question: 'Test question' }),
      headers: { 'Content-Type': 'application/json' }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('jobId')
    expect(data).toHaveProperty('status')
  })
})
```

### Component Test
```typescript
// components/TarotCard/__tests__/TarotCard.test.tsx
import { render, screen } from '@testing-library/react'
import TarotCard from '../TarotCard'

describe('TarotCard', () => {
  test('renders card name', () => {
    render(<TarotCard name="The Sun" image="cards/sun.jpg" />)
    expect(screen.getByText('The Sun')).toBeInTheDocument()
  })

  test('renders card image', () => {
    render(<TarotCard name="The Sun" image="cards/sun.jpg" />)
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', 'cards/sun.jpg')
  })
})
```

### Utility Test
```typescript
// lib/cards/__tests__/shuffle.test.ts
import { shuffleCards } from '../shuffle'

describe('shuffleCards', () => {
  test('returns shuffled array with same length', () => {
    const cards = ['card1', 'card2', 'card3', 'card4', 'card5']
    const shuffled = shuffleCards(cards)

    expect(shuffled).toHaveLength(5)
    expect(shuffled).toContain('card1')
    expect(shuffled).toContain('card5')
  })

  test('returns different order', () => {
    const cards = [1, 2, 3, 4, 5]
    const shuffled = shuffleCards(cards)

    // Very small chance of false negative, but acceptable for tests
    expect(shuffled).not.toEqual(cards)
  })
})
```

## Test Command Execution Flow

### When Running `/run-test`:
1. **Check Test Setup**:
   - Verify package.json has test scripts
   - Check for Jest/Vitest configuration
   - Confirm test dependencies are installed

2. **If No Test Setup**:
   - Suggest installing testing dependencies
   - Provide configuration examples
   - Recommend initial test structure

3. **If Tests Exist**:
   - Execute `npm test` or appropriate test script
   - Capture and display results
   - Show coverage if available

4. **Report Results**:
   - Number of tests run
   - Pass/fail status
   - Coverage percentage (if configured)
   - Any errors or warnings

### When Running `/run-test <type>`:
1. **Validate Test Type**:
   - Check if test type is supported
   - Verify corresponding test script exists

2. **Execute Specific Test**:
   - Run targeted test command
   - Filter results by test type

3. **Report Results**:
   - Show results for specific test type
   - Indicate if no tests found for that type

## Testing Best Practices

### 1. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Execute the code being tested
- **Assert**: Verify the expected outcome

### 2. Component Testing
- Test user behavior, not implementation details
- Use React Testing Library queries
- Mock external dependencies

### 3. API Testing
- Test request/response cycle
- Mock database operations
- Test error scenarios

### 4. Test Coverage Goals
- Aim for 80%+ code coverage
- Focus on critical paths
- Test error handling

## Current Status
- **Test Framework**: Not configured yet
- **Test Dependencies**: Need to install
- **Test Files**: 0 tests exist
- **Configuration**: Need Jest/Playwright setup
- **Ready for Testing**: ❌ Setup required first

## Next Steps to Enable Testing
1. Install testing dependencies
2. Configure Jest for unit/integration tests
3. Set up Playwright for E2E tests
4. Create initial test structure
5. Add test scripts to package.json
6. Start writing tests for critical features