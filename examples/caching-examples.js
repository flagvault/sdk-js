/**
 * FlagVault SDK Caching Examples
 *
 * This file demonstrates the new caching capabilities in FlagVault SDK v1.2.0
 */

import FlagVaultSDK from "@flagvault/sdk";

// Example 1: Basic usage with default caching (enabled by default)
async function basicCachingExample() {
  console.log("=== Basic Caching Example ===");

  const sdk = new FlagVaultSDK({
    apiKey: "your-api-key-here",
    // Caching is enabled by default with 5-minute TTL
  });

  // First call - will hit the API
  console.time("First call");
  const isEnabled1 = await sdk.isEnabled("new-feature");
  console.timeEnd("First call"); // ~77ms
  console.log("First call result:", isEnabled1);

  // Second call - will hit the cache
  console.time("Second call");
  const isEnabled2 = await sdk.isEnabled("new-feature");
  console.timeEnd("Second call"); // <1ms
  console.log("Second call result:", isEnabled2);

  // Clean up
  sdk.destroy();
}

// Example 2: Custom cache configuration
async function customCacheExample() {
  console.log("\n=== Custom Cache Configuration Example ===");

  const sdk = new FlagVaultSDK({
    apiKey: "your-api-key-here",
    cache: {
      enabled: true,
      ttl: 600, // 10 minutes cache
      maxSize: 500, // Store up to 500 flags
      refreshInterval: 120, // Background refresh every 2 minutes
      fallbackBehavior: "default",
    },
  });

  const isEnabled = await sdk.isEnabled("long-lived-feature");
  console.log("Feature enabled:", isEnabled);

  // Get cache statistics
  const stats = sdk.getCacheStats();
  console.log("Cache stats:", {
    size: stats.size,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    memoryUsage: `${stats.memoryUsage} bytes`,
  });

  sdk.destroy();
}

// Example 3: Debugging cache behavior
async function cacheDebuggingExample() {
  console.log("\n=== Cache Debugging Example ===");

  const sdk = new FlagVaultSDK({
    apiKey: "your-api-key-here",
    cache: { ttl: 60 }, // 1-minute cache for demo
  });

  // Check a flag
  await sdk.isEnabled("debug-feature");

  // Debug the specific flag
  const debugInfo = sdk.debugFlag("debug-feature");
  console.log("Debug info:", {
    flagKey: debugInfo.flagKey,
    cached: debugInfo.cached,
    value: debugInfo.value,
    timeUntilExpiry: debugInfo.timeUntilExpiry
      ? `${Math.round(debugInfo.timeUntilExpiry / 1000)}s`
      : "N/A",
  });

  sdk.destroy();
}

// Example 4: High-performance application with multiple flags
async function highPerformanceExample() {
  console.log("\n=== High Performance Example ===");

  const sdk = new FlagVaultSDK({
    apiKey: "your-api-key-here",
    cache: {
      enabled: true,
      ttl: 300,
      refreshInterval: 60, // Proactive refresh
    },
  });

  const flags = [
    "new-dashboard",
    "advanced-analytics",
    "beta-features",
    "premium-content",
    "experimental-ui",
  ];

  console.time("Check 5 flags");

  // First iteration - some cache misses
  for (const flag of flags) {
    const isEnabled = await sdk.isEnabled(flag);
    console.log(`${flag}: ${isEnabled}`);
  }

  console.timeEnd("Check 5 flags"); // ~77ms for first, <1ms for others

  console.log("\nSecond iteration (all cached):");
  console.time("Check 5 flags (cached)");

  // Second iteration - all cache hits
  for (const flag of flags) {
    const isEnabled = await sdk.isEnabled(flag);
    console.log(`${flag}: ${isEnabled}`);
  }

  console.timeEnd("Check 5 flags (cached)"); // <5ms total

  // Show cache performance
  const stats = sdk.getCacheStats();
  console.log("\nFinal cache stats:", {
    size: stats.size,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
  });

  sdk.destroy();
}

// Example 5: Disabling cache for real-time scenarios
async function realTimeExample() {
  console.log("\n=== Real-time (No Cache) Example ===");

  const sdk = new FlagVaultSDK({
    apiKey: "your-api-key-here",
    cache: {
      enabled: false, // Disable caching for real-time updates
    },
  });

  // Every call will hit the API
  const isEnabled1 = await sdk.isEnabled("real-time-feature");
  const isEnabled2 = await sdk.isEnabled("real-time-feature");

  console.log("First call:", isEnabled1);
  console.log("Second call:", isEnabled2);
  console.log("Both calls hit the API directly");

  sdk.destroy();
}

// React component example with caching
function ReactComponentExample() {
  return `
function FeatureComponent() {
  // This hook will benefit from SDK caching automatically
  const { isEnabled, isLoading } = useFeatureFlag(sdk, 'new-feature', false);

  if (isLoading) return <div>Loading...</div>;

  return isEnabled ? <NewFeature /> : <OldFeature />;
}

// Multiple components using the same flag will benefit from caching
function AnotherComponent() {
  const { isEnabled } = useFeatureFlag(sdk, 'new-feature', false); // Cache hit!
  return <div>Feature is {isEnabled ? 'enabled' : 'disabled'}</div>;
}
  `;
}

// Export examples for testing/demo purposes
export {
  basicCachingExample,
  customCacheExample,
  cacheDebuggingExample,
  highPerformanceExample,
  realTimeExample,
  ReactComponentExample,
};

// Run examples if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  (async () => {
    try {
      await basicCachingExample();
      await customCacheExample();
      await cacheDebuggingExample();
      await highPerformanceExample();
      await realTimeExample();

      console.log("\n=== React Example ===");
      console.log(ReactComponentExample());
    } catch (error) {
      console.error("Example failed:", error);
    }
  })();
}
