# Comprehensive Testing Guide for Wuta-Wuta Blockchain Engine

## Overview

This guide provides comprehensive testing strategies and procedures for the Wuta-Wuta AI-Human collaborative art marketplace. The testing suite ensures reliability, security, and performance of both smart contracts and frontend components.

## Testing Architecture

### 1. Smart Contract Testing
- **Unit Tests**: Individual contract function testing
- **Integration Tests**: Cross-contract interaction testing
- **Performance Tests**: Gas optimization and benchmarking
- **Security Tests**: Vulnerability scanning and analysis

### 2. Frontend Testing
- **Unit Tests**: Component and store testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user journey testing

### 3. CI/CD Pipeline
- **Automated Testing**: GitHub Actions workflow
- **Multi-stage Pipeline**: Sequential testing stages
- **Coverage Reporting**: Code coverage tracking
- **Security Auditing**: Automated security scans

## Running Tests Locally

### Prerequisites
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Smart Contract Tests

#### Run All Contract Tests
```bash
npm run test:contracts
```

#### Run Specific Test Categories
```bash
# Unit tests only
npx hardhat test test/*.test.js

# Integration tests
npm run test:integration

# Performance tests
npx hardhat test test/performance/**/*.test.js --reporter gas-reporter

# Coverage report
npm run test:contracts:coverage

# Gas optimization report
npm run test:contracts:gas
```

#### Contract Security Tests
```bash
# Slither analysis
npm run security:slither

# Mythril analysis
npm run security:mythril
```

### Frontend Tests

#### Run All Frontend Tests
```bash
npm test
```

#### Run with Coverage
```bash
npm run test:coverage
```

#### Run CI Mode
```bash
npm run test:ci
```

#### Linting and Formatting
```bash
# ESLint
npm run lint

# Solhint for contracts
npm run lint:contracts

# Prettier
npm run format
npm run format:contracts
```

## Test Structure

### Smart Contract Tests

#### Helper Utilities
- `test/helpers/contracts.js`: Contract deployment and interaction helpers
- `test/helpers/utils.js`: General testing utilities and assertions

#### Test Categories
- `test/MuseNFT.test.js`: MuseNFT contract comprehensive tests
- `test/ProjectManager.test.js`: ProjectManager contract tests
- `test/integration/marketplace.test.js`: Cross-contract integration tests
- `test/performance/gas-optimization.test.js`: Gas usage benchmarks

#### Key Test Scenarios

**MuseNFT Contract**
- AI model registration
- Collaborative artwork creation
- Artwork evolution mechanics
- Royalty management
- Access control
- Error handling

**ProjectManager Contract**
- Project creation and management
- Issue tracking
- Maintainer permissions
- Status updates

**Integration Tests**
- Artwork creation with project tracking
- Multi-user collaboration flows
- Royalty and fee integration
- Error handling across contracts

### Frontend Tests

#### Store Tests
- `src/store/__tests__/walletStore.test.js`: Wallet connection and management
- `src/store/__tests__/museStore.test.js`: Muse platform functionality
- `src/store/__tests__/dripsStore.test.js`: Drips streaming functionality
- `src/store/__tests__/flowStore.test.js`: Flow payment functionality

#### Component Tests
- `src/components/__tests__/CreateArt.test.js`: Art creation component
- Additional component tests as needed

## Testing Best Practices

### Smart Contract Testing

1. **Comprehensive Coverage**
   - Test all public functions
   - Test all modifiers
   - Test edge cases and error conditions
   - Test event emissions

2. **State Management**
   - Use `beforeEach` to reset state
   - Test state transitions
   - Verify storage updates

3. **Security Testing**
   - Test access controls
   - Test reentrancy protection
   - Test input validation
   - Test overflow/underflow

4. **Gas Optimization**
   - Monitor gas usage
   - Benchmark critical functions
   - Test with varying input sizes

### Frontend Testing

1. **Component Testing**
   - Test rendering
   - Test user interactions
   - Test props and state
   - Test error states

2. **Store Testing**
   - Test state mutations
   - Test async actions
   - Test error handling
   - Test getters

3. **Integration Testing**
   - Test component-store interactions
   - Test API calls
   - Test user flows

## Coverage Requirements

### Smart Contracts
- **Target Coverage**: 95%+ line coverage
- **Critical Functions**: 100% coverage
- **Event Coverage**: 100% coverage

### Frontend
- **Target Coverage**: 90%+ line coverage
- **Components**: 85%+ coverage
- **Stores**: 95%+ coverage

## Performance Benchmarks

### Gas Usage Limits
- **Artwork Creation**: < 200,000 gas
- **Artwork Evolution**: < 150,000 gas
- **Model Registration**: < 50,000 gas
- **Royalty Setting**: < 30,000 gas

### Frontend Performance
- **Initial Load**: < 3 seconds
- **Component Render**: < 100ms
- **State Updates**: < 50ms

## Security Checklist

### Smart Contract Security
- [ ] Access control testing
- [ ] Reentrancy protection
- [ ] Input validation
- [ ] Overflow/underflow protection
- [ ] Front-end running protection
- [ ] Integer overflow checks

### Frontend Security
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] Secure data handling
- [ ] Environment variable security

## CI/CD Pipeline

### Workflow Stages
1. **Smart Contract Tests**: Unit, integration, coverage
2. **Frontend Tests**: Unit, integration, linting
3. **Integration Tests**: Cross-system testing
4. **Security Audit**: Vulnerability scanning
5. **Performance Tests**: Gas benchmarks
6. **Build Test**: Production build verification
7. **Deploy Preview**: PR preview deployment

### Triggers
- **Push**: main, develop branches
- **Pull Request**: main, develop branches

### Notifications
- Success: All tests passed notification
- Failure: Detailed failure reporting

## Troubleshooting

### Common Issues

#### Contract Tests
```bash
# Fix compilation issues
npx hardhat clean
npx hardhat compile

# Reset test environment
npx hardhat node --reset

# Debug specific test
npx hardhat test test/MuseNFT.test.js --verbose
```

#### Frontend Tests
```bash
# Clear cache
npm run test -- --clearCache

# Update snapshots
npm run test -- --updateSnapshot

# Debug specific test
npm test -- --testNamePattern="specific test"
```

#### Gas Issues
```bash
# Detailed gas report
REPORT_GAS=true npx hardhat test

# Gas optimization suggestions
npx hardhat test --reporter gas-reporter
```

## Contributing to Tests

### Adding New Tests
1. Follow existing test patterns
2. Use helper utilities
3. Include error cases
4. Add coverage for new features
5. Update documentation

### Test Standards
- Use descriptive test names
- Include setup and teardown
- Test both success and failure cases
- Use assertions effectively
- Document complex scenarios

## Continuous Improvement

### Metrics to Track
- Test coverage trends
- Gas usage optimization
- Test execution time
- Failure rates
- Security scan results

### Regular Reviews
- Weekly test performance review
- Monthly security audit review
- Quarterly coverage assessment
- Annual testing strategy update

## Support

For testing-related questions or issues:
1. Check this guide first
2. Review existing test files
3. Consult team documentation
4. Create issue with detailed description

---

**Note**: This testing suite is designed to ensure the reliability and security of the Wuta-Wuta platform. Regular updates and maintenance are essential for continued effectiveness.
