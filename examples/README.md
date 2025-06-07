# FlagVault SDK Examples

This directory contains practical examples of how to use the FlagVault JavaScript/TypeScript SDK.

## Files

- **`basic-usage.js`** - Basic JavaScript usage with CommonJS
- **`typescript-usage.ts`** - Advanced TypeScript usage with error handling

## Environment Setup

### API Keys

FlagVault provides separate API keys for different environments:

- **Production Environment**: API keys prefixed with `live_`
- **Test Environment**: API keys prefixed with `test_`

### Environment Variables

Set up your environment variables:

```bash
# For production
export FLAGVAULT_API_KEY="live_your-production-api-key-here"

# For test/development  
export FLAGVAULT_API_KEY="test_your-test-api-key-here"
```

### Running Examples

```bash
# Basic JavaScript example
node basic-usage.js

# TypeScript example (requires compilation)
npx ts-node typescript-usage.ts
# Or compile first: npx tsc typescript-usage.ts && node typescript-usage.js
```

## Getting API Credentials

1. Sign up at [FlagVault](https://flagvault.com)
2. Create a new organization
3. Go to Settings > API Credentials
4. You'll see separate API keys for production and test environments

## Environment Detection

The SDK automatically determines which environment to use based on your API key prefix:

```typescript
// This will use the production environment
const prodSdk = new FlagVaultSDK({ 
  apiKey: 'live_abc123...' 
});

// This will use the test environment
const testSdk = new FlagVaultSDK({ 
  apiKey: 'test_xyz789...' 
});
```

No additional configuration needed!

## Common Patterns

### Single API Key Initialization
```typescript
const sdk = new FlagVaultSDK({
  apiKey: process.env.FLAGVAULT_API_KEY // Environment auto-detected from prefix
});
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