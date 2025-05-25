# FlagVault JavaScript/TypeScript SDK

A lightweight JavaScript/TypeScript SDK that allows developers to integrate FlagVault's feature flag service into their applications. Feature flags let you enable/disable features remotely without deploying new code.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Use Cases](#use-cases)
- [Project Structure](#project-structure)
- [Development](#development)
- [Requirements](#requirements)

## Installation

```bash
npm install @flagvault/sdk
# or
yarn add @flagvault/sdk
```

## Quick Start

```typescript
import FlagVaultSDK, { FlagVaultAuthenticationError, FlagVaultNetworkError } from '@flagvault/sdk';

// Initialize the SDK with your API credentials
const sdk = new FlagVaultSDK({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  // Optional: custom base URL and timeout
  // baseUrl: 'https://custom-api.flagvault.com',
  // timeout: 10000
});

// Check if a feature flag is enabled
async function checkFeature() {
  try {
    const isEnabled = await sdk.isEnabled('my-feature-flag');
    
    if (isEnabled) {
      // Feature is enabled, run feature code
      console.log('Feature is enabled!');
    } else {
      // Feature is disabled, run fallback code
      console.log('Feature is disabled.');
    }
  } catch (error) {
    if (error instanceof FlagVaultAuthenticationError) {
      console.error('Invalid API credentials');
    } else if (error instanceof FlagVaultNetworkError) {
      console.error('Network connection failed');
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

checkFeature();
```

## Project Overview

### What It Is

FlagVault JavaScript/TypeScript SDK provides a simple, reliable way to integrate feature flags into your applications. Feature flags (also known as feature toggles) allow you to:

- Enable/disable features without deploying new code
- Perform A/B testing and gradual rollouts
- Create kill switches for problematic features
- Manage environment-specific features

### Core Functionality

The SDK centers around one main class and method:

```typescript
// Initialize once
const sdk = new FlagVaultSDK({ apiKey: 'key', apiSecret: 'secret' });

// Use throughout your application
if (await sdk.isEnabled('new-checkout-flow')) {
  showNewCheckout();
} else {
  showOldCheckout();
}
```

### How It Works

1. **Initialize**: Create SDK instance with API credentials from your FlagVault dashboard
2. **Check Flag**: Call `isEnabled('flag-key')` anywhere in your code
3. **HTTP Request**: SDK makes secure GET request to FlagVault API
4. **Parse Response**: Returns boolean from API response
5. **Handle Errors**: Specific exceptions for different failure scenarios

## Error Handling

The SDK provides specific exception types for different error scenarios:

```typescript
import FlagVaultSDK, {
  FlagVaultError,
  FlagVaultAuthenticationError,
  FlagVaultNetworkError,
  FlagVaultAPIError,
} from '@flagvault/sdk';

try {
  const isEnabled = await sdk.isEnabled('my-feature-flag');
} catch (error) {
  if (error instanceof FlagVaultAuthenticationError) {
    // Handle authentication errors (401, 403)
    console.error('Check your API credentials');
  } else if (error instanceof FlagVaultNetworkError) {
    // Handle network errors (timeouts, connection issues)
    console.error('Network connection problem');
  } else if (error instanceof FlagVaultAPIError) {
    // Handle API errors (500, malformed responses, etc.)
    console.error('API error occurred');
  } else {
    // Handle invalid input (empty flag_key, etc.)
    console.error('Invalid input provided');
  }
}
```

### Exception Types

- **`FlagVaultAuthenticationError`**: Invalid API credentials (401/403 responses)
- **`FlagVaultNetworkError`**: Connection timeouts, network failures
- **`FlagVaultAPIError`**: Server errors, malformed responses
- **`Error`**: Invalid input parameters (empty flag keys, etc.)
- **`FlagVaultError`**: Base exception class for all SDK errors

## Configuration

### SDK Parameters

- **`apiKey`** (required): Your FlagVault API key
- **`apiSecret`** (required): Your FlagVault API secret  
- **`baseUrl`** (optional): Custom API endpoint. Defaults to `https://api.flagvault.com`
- **`timeout`** (optional): Request timeout in milliseconds. Defaults to 10000

### Getting API Credentials

1. Sign up at [FlagVault](https://flagvault.com)
2. Create a new project
3. Go to Settings > API Credentials
4. Generate new API credentials

## API Reference

### `new FlagVaultSDK(config)`

Creates a new FlagVault SDK instance.

**Parameters:**
- `config.apiKey` (string): Your FlagVault API key
- `config.apiSecret` (string): Your FlagVault API secret
- `config.baseUrl` (string, optional): Custom API endpoint
- `config.timeout` (number, optional): Request timeout in milliseconds

**Throws:**
- `Error`: If apiKey or apiSecret is empty

### `isEnabled(flagKey: string): Promise<boolean>`

Checks if a feature flag is enabled.

**Parameters:**
- `flagKey` (string): The key/name of the feature flag

**Returns:** 
- `Promise<boolean>`: True if the flag is enabled, False otherwise

**Throws:**
- `Error`: If flagKey is empty or null
- `FlagVaultAuthenticationError`: If API credentials are invalid
- `FlagVaultNetworkError`: If network request fails
- `FlagVaultAPIError`: If API returns an error

## Use Cases

### 1. A/B Testing
```typescript
if (await sdk.isEnabled('new-ui-design')) {
  renderNewDesign();
} else {
  renderCurrentDesign();
}
```

### 2. Gradual Rollouts
```typescript
if (await sdk.isEnabled('premium-feature')) {
  showPremiumFeatures();
} else {
  showBasicFeatures();
}
```

### 3. Kill Switches
```typescript
if (await sdk.isEnabled('external-api-integration')) {
  await callExternalAPI();
} else {
  useCachedData(); // Fallback if external service has issues
}
```

### 4. Environment-Specific Features
```typescript
if (await sdk.isEnabled('debug-mode')) {
  enableVerboseLogging();
  showDebugInfo();
}
```

## Project Structure

```
sdk-js/
├── src/
│   └── index.ts            # Main SDK implementation
├── tests/
│   ├── index.test.ts       # Test suite
│   └── jest.setup.ts       # Test configuration
├── dist/                   # Compiled JavaScript
├── LICENSE                 # MIT license
├── README.md              # This file
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
└── jest.config.ts         # Jest configuration
```

### Key Features

- **🚀 Simple**: One method, clear API
- **🛡️ Reliable**: Comprehensive error handling with custom exceptions
- **🔧 TypeScript**: Full type safety and IDE support
- **✅ Well-Tested**: Comprehensive test coverage
- **⚡ Production-Ready**: Configurable timeouts, proper error types
- **📦 Lightweight**: Zero dependencies (uses native fetch)

### Testing Strategy

The SDK includes comprehensive tests covering:
- ✅ Initialization (valid/invalid credentials)
- ✅ Successful flag checks (enabled/disabled responses)
- ✅ Error scenarios (authentication, network, API errors)
- ✅ Edge cases (invalid JSON, missing fields, special characters)
- ✅ Timeout and connection handling

## Requirements

- Node.js 16+ or modern browsers with fetch support
- TypeScript 4.0+ (for TypeScript projects)

## Development

### Setting up for development

```bash
# Clone the repository
git clone https://github.com/flagvault/sdk-js.git
cd sdk-js

# Install dependencies
npm install
```

### Running tests

```bash
npm test
# With coverage
npm run test:coverage
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Build
npm run build
```

### Building the package

```bash
npm run build
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Support

- 📚 [Documentation](https://flagvault.com/docs)
- 🐛 [Bug Reports](https://github.com/flagvault/sdk-js/issues)
- 💬 [Community Support](https://flagvault.com/community)

---

Made with ❤️ by the FlagVault team