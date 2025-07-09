# Testing Guide - Xplore

## Overview

This guide covers the comprehensive testing strategy for the Xplore application, including unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Unit & Integration Tests**: Jest + Testing Library
- **E2E Tests**: Cypress
- **API Testing**: Supertest
- **Code Coverage**: Jest Coverage + Codecov
- **CI/CD**: GitHub Actions

## Test Structure

```
xplore/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── integration/     # API integration tests
│   │   │   │   └── middleware/      # Middleware tests
│   │   │   ├── domains/
│   │   │   │   └── [domain]/
│   │   │   │       └── services/__tests__/  # Service unit tests
│   │   │   └── test/
│   │   │       ├── factories/       # Test data factories
│   │   │       ├── utils/           # Test utilities
│   │   │       └── setup.ts         # Test setup
│   │   └── jest.config.js
│   │
│   └── web/
│       ├── src/
│       │   └── domains/
│       │       └── [domain]/
│       │           └── components/__tests__/  # Component tests
│       ├── cypress/
│       │   ├── e2e/                # E2E test specs
│       │   └── support/            # Cypress commands & utilities
│       ├── jest.config.js
│       └── cypress.config.ts
│
└── scripts/
    └── test-coverage-report.js     # Coverage report generator
```

## Running Tests

### All Tests
```bash
# Run all tests across the monorepo
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run CI tests (with coverage)
pnpm test:ci

# Run E2E tests
pnpm test:e2e

# Run everything (unit + integration + E2E)
pnpm test:all
```

### API Tests
```bash
cd apps/api

# Run unit tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test authService.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="should login"
```

### Frontend Tests
```bash
cd apps/web

# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests (interactive)
pnpm cypress:open

# Run E2E tests (headless)
pnpm cypress:run
```

## Writing Tests

### Unit Tests

#### Backend Service Test Example
```typescript
// apps/api/src/domains/auth/services/__tests__/authService.test.ts
import { AuthService } from '../authService'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/userFactory'

jest.mock('@/lib/prisma')

describe('AuthService', () => {
  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = createMockUser()
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      
      const result = await AuthService.login({
        email: 'test@example.com',
        password: 'password123',
      })
      
      expect(result).toHaveProperty('tokens')
      expect(result.user.email).toBe('test@example.com')
    })
  })
})
```

#### Frontend Component Test Example
```typescript
// apps/web/src/domains/locations/components/__tests__/LocationCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationCard } from '../LocationCard'

describe('LocationCard', () => {
  it('should save location when save button clicked', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    
    render(<LocationCard location={mockLocation} onSave={onSave} />)
    
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    expect(onSave).toHaveBeenCalledWith(mockLocation)
  })
})
```

### Integration Tests

#### API Integration Test Example
```typescript
// apps/api/src/__tests__/integration/auth.test.ts
import request from 'supertest'
import app from '@/app'

describe('POST /api/auth/register', () => {
  it('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      })
      .expect(201)
      
    expect(response.body).toHaveProperty('user')
    expect(response.body).toHaveProperty('tokens')
  })
})
```

### E2E Tests

#### Cypress E2E Test Example
```typescript
// apps/web/cypress/e2e/locations.cy.ts
describe('Location Discovery', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123')
  })
  
  it('should search and save location', () => {
    cy.visit('/locations')
    
    // Search for location
    cy.get('[data-testid="location-search"]').type('Paris')
    cy.get('[data-testid="search-results"]').should('be.visible')
    
    // Save location
    cy.get('[data-testid="save-button"]').first().click()
    cy.contains('Location saved').should('be.visible')
  })
})
```

## Test Utilities

### Test Factories
Create consistent test data:
```typescript
// apps/api/src/test/factories/userFactory.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
})
```

### Custom Test Helpers
```typescript
// apps/api/src/test/utils/testHelpers.ts
export const createAuthenticatedRequest = (userId: string) => {
  const token = generateTestToken({ userId })
  return createMockRequest({
    headers: { authorization: `Bearer ${token}` },
  })
}
```

### Cypress Custom Commands
```typescript
// apps/web/cypress/support/commands.ts
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/auth/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
})
```

## Coverage Requirements

- **Target Coverage**: 80% for all metrics
- **Metrics**: Lines, Statements, Functions, Branches
- **Enforcement**: CI fails if coverage drops below threshold

### Viewing Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# Open HTML coverage report
open apps/api/coverage/lcov-report/index.html
open apps/web/coverage/lcov-report/index.html

# Generate combined report
node scripts/test-coverage-report.js
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern: Arrange, Act, Assert

### 2. Mocking
- Mock external dependencies (database, APIs)
- Use test factories for consistent data
- Clear mocks between tests

### 3. Async Testing
- Always await async operations
- Use `waitFor` for UI updates
- Handle loading states

### 4. E2E Testing
- Test critical user journeys
- Use data-testid attributes
- Mock external APIs for consistency
- Keep tests independent

### 5. Performance
- Run unit tests in parallel
- Use test database for integration tests
- Clean up test data after runs

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled daily runs

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
- Linting & Type checking
- Unit tests with coverage
- Integration tests
- E2E tests
- Coverage reporting to Codecov
- SonarCloud analysis
```

## Debugging Tests

### Jest Debugging
```bash
# Run single test file in debug mode
node --inspect-brk node_modules/.bin/jest authService.test.ts

# Use VS Code debugger with launch.json
```

### Cypress Debugging
```bash
# Open Cypress in interactive mode
pnpm cypress:open

# Use cy.debug() in tests
cy.get('[data-testid="submit"]').debug().click()

# Pause execution
cy.pause()
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for missing `await` statements

2. **Flaky E2E tests**
   - Add explicit waits: `cy.wait('@apiCall')`
   - Use retry logic for assertions

3. **Coverage not updating**
   - Clear Jest cache: `jest --clearCache`
   - Delete coverage folders and regenerate

4. **Mock not working**
   - Ensure mock is before import
   - Check mock path matches actual import

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass locally
3. Maintain or improve coverage
4. Update test documentation if needed
5. Add E2E tests for critical flows

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Cypress Documentation](https://docs.cypress.io)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- [Code Coverage Best Practices](https://kentcdodds.com/blog/code-coverage)