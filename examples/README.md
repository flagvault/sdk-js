# FlagVault SDK Examples

This directory contains practical examples of how to use the FlagVault JavaScript/TypeScript SDK.

## Examples

### 1. Basic Usage (`basic-usage.js`)

A simple JavaScript example showing:
- SDK initialization
- Basic feature flag checking
- Error handling with specific exception types
- Console output for demonstration

**Run with:**
```bash
# Set your credentials
export FLAGVAULT_API_KEY="your-api-key"
export FLAGVAULT_API_SECRET="your-api-secret"

# Run the example
node examples/basic-usage.js
```

### 2. TypeScript Usage (`typescript-usage.ts`)

An advanced TypeScript example demonstrating:
- Type-safe SDK usage
- Feature manager class pattern
- Batch flag checking with Promise.all
- Detailed error handling strategies
- Safe defaults on errors

**Run with:**
```bash
# Set your credentials
export FLAGVAULT_API_KEY="your-api-key"
export FLAGVAULT_API_SECRET="your-api-secret"

# Compile and run (if you have ts-node installed)
npx ts-node examples/typescript-usage.ts

# Or compile first
npx tsc examples/typescript-usage.ts --target es2017 --module commonjs
node examples/typescript-usage.js
```

## Getting API Credentials

1. Sign up at [FlagVault](https://flagvault.com)
2. Create a new project
3. Go to Settings > API Credentials
4. Generate new API credentials
5. Set them as environment variables or replace the placeholder values

## Common Patterns

### Environment Variables
```bash
export FLAGVAULT_API_KEY="your-api-key-here"
export FLAGVAULT_API_SECRET="your-api-secret-here"
```

### Error Handling Strategy
```typescript
try {
  const isEnabled = await sdk.isEnabled('my-feature');
  // Use the flag
} catch (error) {
  if (error instanceof FlagVaultAuthenticationError) {
    // Handle auth errors - maybe refresh credentials
  } else if (error instanceof FlagVaultNetworkError) {
    // Handle network errors - maybe use cached values
  } else {
    // Handle other errors - use safe defaults
  }
  return false; // Safe default
}
```

### Batch Flag Checking
```typescript
const [feature1, feature2, feature3] = await Promise.all([
  sdk.isEnabled('feature-1'),
  sdk.isEnabled('feature-2'),
  sdk.isEnabled('feature-3')
]);
```

## Production Usage Tips

1. **Use Environment Variables**: Never hardcode API credentials
2. **Handle Errors Gracefully**: Always provide fallback behavior
3. **Cache When Appropriate**: Consider caching flag values for performance
4. **Use Timeouts**: Set reasonable timeout values for your use case
5. **Monitor Usage**: Log flag checks for debugging and analytics