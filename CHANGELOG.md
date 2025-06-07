# Changelog

All notable changes to the FlagVault JavaScript/TypeScript SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-07

### 🎉 First Stable Release

This is the first stable release of the FlagVault JavaScript/TypeScript SDK, featuring a simplified API design with automatic environment detection.

### 💥 Breaking Changes

- **Removed `apiSecret` parameter**: SDK now uses single API key authentication
- **Removed `baseUrl` from public API**: Base URL is now an internal configuration
- **API endpoint change**: Updated from `/feature-flag/` to `/api/feature-flag/`

### ✨ New Features

- **Automatic environment detection**: Environment (production/test) is automatically determined from API key prefix
  - `live_` prefix → Production environment
  - `test_` prefix → Test environment
- **Simplified initialization**: Only requires a single `apiKey` parameter
- **Zero configuration**: No need to specify environment or base URL

### 🛠️ Changes

- Updated all examples to use single API key pattern
- Improved TypeScript types for better IDE support
- Enhanced error messages for better debugging
- Updated documentation with environment management guide

### 📦 Dependencies

- No external runtime dependencies (uses native fetch API)
- Development dependencies updated to latest versions

### 🔄 Migration Guide

#### Before (0.x.x):
```typescript
const sdk = new FlagVaultSDK({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  baseUrl: 'https://api.flagvault.com' // optional
});
```

#### After (1.0.0):
```typescript
const sdk = new FlagVaultSDK({
  apiKey: 'live_your-api-key-here', // or 'test_' for test environment
  timeout: 10000 // optional, in milliseconds
});
```

### 📚 Documentation

- Comprehensive README with environment management section
- Updated API reference documentation
- New examples demonstrating environment-specific usage
- TypeScript example with advanced patterns

---

## [0.0.1] - 2024-11-15

### 🚀 Initial Release

- Basic SDK implementation with `isEnabled()` method
- Support for API key and secret authentication
- Error handling with custom exception types
- TypeScript support with full type definitions
- Basic examples and documentation