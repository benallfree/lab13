# Utility Tests

This directory contains comprehensive tests for the utility functions in the `@util/` directory.

## Test Files

- `deepMerge.test.ts` - Tests for the deep merge utility function
- `generateId.test.ts` - Tests for the ID generation utility function
- `index.test.ts` - Test index that imports all utility tests

## Running Tests

### Run all utility tests:

```bash
bun test src/util/__tests__/
```

### Run specific test file:

```bash
bun test src/util/__tests__/deepMerge.test.ts
bun test src/util/__tests__/generateId.test.ts
```

### Run all tests in the project:

```bash
bun test
```

## Test Coverage

### deepMerge Tests

- Simple object merging
- Nested object merging
- Null value handling (deletes keys)
- Array handling (replaces arrays)
- Edge cases (empty objects, undefined/null inputs)
- Complex nested structures
- Entity collection parameter handling

### generateId Tests

- ID format validation (14 characters, alphanumeric)
- Uniqueness verification
- Performance testing (rapid generation)
- Time-based component validation
- Concurrent generation handling
- Character distribution validation

## Adding New Tests

When adding new utility functions:

1. Create a new test file: `functionName.test.ts`
2. Import the function and write comprehensive tests
3. Add the test file to `index.test.ts`
4. Ensure all tests pass before committing

## Test Configuration

Tests use Bun's built-in test runner with TypeScript support. The configuration is in `bunfig.toml` at the project root.
