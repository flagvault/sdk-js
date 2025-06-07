const FlagVaultSDK = require("@flagvault/sdk").default;
const {
  FlagVaultAuthenticationError,
  FlagVaultNetworkError,
  FlagVaultAPIError,
} = require("@flagvault/sdk");

// Example script for testing the FlagVault JavaScript SDK

async function main() {
  // Use your API key here (environment is auto-detected from key prefix)
  const apiKey = process.env.FLAGVAULT_API_KEY || "live_your-api-key-here";

  // Initialize the SDK
  const sdk = new FlagVaultSDK({
    apiKey,
    // Optional: custom timeout
    // timeout: 10000
  });

  console.log("🚀 FlagVault SDK Example");
  console.log("========================");

  // Test the specified feature flag
  const flagKey = "test";

  try {
    console.log(`\n🔍 Checking flag '${flagKey}'...`);
    const isEnabled = await sdk.isEnabled(flagKey);

    if (isEnabled) {
      console.log(`✅ Flag '${flagKey}' is ENABLED`);
      console.log("   → Running new feature code");
    } else {
      console.log(`❌ Flag '${flagKey}' is DISABLED`);
      console.log("   → Running fallback code");
    }
  } catch (error) {
    console.error("\n❌ Error occurred:");

    if (error instanceof FlagVaultAuthenticationError) {
      console.error("   → Authentication failed - check your API credentials");
    } else if (error instanceof FlagVaultNetworkError) {
      console.error("   → Network error - check your connection");
    } else if (error instanceof FlagVaultAPIError) {
      console.error("   → API error:", error.message);
    } else {
      console.error("   → Unexpected error:", error.message);
    }
  }

  console.log("\n✨ Example completed");
}

// Run the example
main().catch(console.error);
