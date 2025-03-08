# FlagVault SDK for JavaScript/TypeScript

A lightweight TypeScript SDK for FlagVault, enabling seamless feature flag integration for modern web applications.

## Installation

```bash
npm install @flagvault/sdk
# or
yarn add @flagvault/sdk
```

## Usage

```typescript
import FlagVaultSDK from '@flagvault/sdk';

// Initialize the SDK with your API credentials
const sdk = new FlagVaultSDK({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  // Optional: custom base URL
  // baseUrl: 'https://custom-api.flagvault.com'
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
    console.error('Error checking feature flag:', error);
  }
}

checkFeature();
```

## API Documentation

For complete API documentation, visit [our documentation site](https://flagvault.github.io/sdk-js/).

## Requirements

- Node.js 14 or later
- Modern browsers with fetch support

## License

MIT