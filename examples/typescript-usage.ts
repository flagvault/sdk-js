import FlagVaultSDK, {
  FlagVaultAuthenticationError,
  FlagVaultNetworkError,
  FlagVaultAPIError,
} from "@flagvault/sdk";

// Example TypeScript usage of the FlagVault SDK

interface FeatureConfig {
  newUI: boolean;
  premiumFeatures: boolean;
  experimentalAPI: boolean;
}

class FeatureManager {
  private sdk: FlagVaultSDK;

  constructor(apiKey: string) {
    this.sdk = new FlagVaultSDK({
      apiKey, // Environment auto-detected from key prefix (live_/test_)
      timeout: 5000, // 5 second timeout
    });
  }

  /**
   * Get all feature flags for the application
   */
  async getFeatureConfig(): Promise<FeatureConfig> {
    try {
      const [newUI, premiumFeatures, experimentalAPI] = await Promise.all([
        this.sdk.isEnabled("new-ui-design"),
        this.sdk.isEnabled("premium-features"),
        this.sdk.isEnabled("experimental-api"),
      ]);

      return {
        newUI,
        premiumFeatures,
        experimentalAPI,
      };
    } catch (error) {
      console.error("Failed to fetch feature configuration:", error);

      // Return safe defaults on error
      return {
        newUI: false,
        premiumFeatures: false,
        experimentalAPI: false,
      };
    }
  }

  /**
   * Check a single feature flag with detailed error handling
   */
  async checkFeatureFlag(flagKey: string): Promise<boolean> {
    try {
      return await this.sdk.isEnabled(flagKey);
    } catch (error) {
      if (error instanceof FlagVaultAuthenticationError) {
        console.error(
          `Authentication failed for flag '${flagKey}':`,
          error.message,
        );
        // Handle auth errors - maybe refresh credentials
      } else if (error instanceof FlagVaultNetworkError) {
        console.error(`Network error for flag '${flagKey}':`, error.message);
        // Handle network errors - maybe use cached values
      } else if (error instanceof FlagVaultAPIError) {
        console.error(`API error for flag '${flagKey}':`, error.message);
        // Handle API errors - maybe retry or use defaults
      } else {
        console.error(`Unexpected error for flag '${flagKey}':`, error);
      }

      // Return safe default
      return false;
    }
  }
}

// Example usage
async function main(): Promise<void> {
  // Use environment-specific API key
  // For production: FLAGVAULT_API_KEY=live_abc123...
  // For test: FLAGVAULT_API_KEY=test_xyz789...
  const apiKey = process.env.FLAGVAULT_API_KEY || "live_your-api-key-here";

  const featureManager = new FeatureManager(apiKey);

  console.log("🎯 TypeScript Feature Manager Example");
  console.log("=====================================");

  // Get all feature configuration
  const config = await featureManager.getFeatureConfig();
  console.log("\n📋 Feature Configuration:");
  console.log("  New UI:", config.newUI ? "✅ Enabled" : "❌ Disabled");
  console.log(
    "  Premium Features:",
    config.premiumFeatures ? "✅ Enabled" : "❌ Disabled",
  );
  console.log(
    "  Experimental API:",
    config.experimentalAPI ? "✅ Enabled" : "❌ Disabled",
  );

  // Check individual flags
  console.log("\n🔍 Individual Flag Checks:");
  const testFlag = await featureManager.checkFeatureFlag("test");
  console.log(`  Test Flag: ${testFlag ? "✅ Enabled" : "❌ Disabled"}`);

  // Example of conditional feature execution
  if (config.newUI) {
    console.log("\n🎨 Rendering new UI design...");
  } else {
    console.log("\n🎨 Rendering classic UI...");
  }

  if (config.premiumFeatures) {
    console.log("💎 Premium features are available");
  }

  console.log("\n✨ TypeScript example completed");
}

// Run the example
main().catch(console.error);
