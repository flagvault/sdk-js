# FlagVault SDK Guidelines

## Build Commands
- **Build**: `npm run build` - Compiles TypeScript code
- **Test**: `npm test` - Run all tests
- **Test Single File**: `npm test -- tests/path/to/file.test.ts` - Run specific test
- **Lint**: `npm run lint` - Run ESLint on all files

## Code Style Guidelines
- **TypeScript**: Strict mode enabled, explicit typing for interfaces
- **Naming**: PascalCase for classes/interfaces (e.g., `FlagorySDK`), camelCase for variables/methods
- **Error Handling**: Use explicit error messages, validate parameters before use
- **Imports**: External imports first, then internal imports
- **Testing**: 
  - Descriptive "should" test names
  - Mock external dependencies (fetch)
  - Test both success and error cases
  - Use beforeEach for test setup

## Project Structure
- Source code in `src/` directory
- Tests in `tests/` directory with `.test.ts` extension
- Compiled output to `dist/` directory
- TypeScript configuration in `tsconfig.json`