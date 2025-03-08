/**
 * Configuration options for the FlagVault SDK.
 * 
 * @group Configuration
 */
export interface FlagVaultSDKConfig {
  /**
   * API Key for authenticating with the FlagVault service.
   * Can be obtained from your FlagVault dashboard.
   */
  apiKey: string;

  /**
   * API Secret for authenticating with the FlagVault service.
   * Can be obtained from your FlagVault dashboard.
   */
  apiSecret: string;

  /**
   * Optional base URL for the FlagVault API.
   * Defaults to "https://api.flagvault.com".
   */
  baseUrl?: string;
}

/**
 * FlagVault SDK for feature flag management.
 * 
 * This SDK allows you to easily integrate feature flags into your JavaScript/TypeScript applications.
 * Feature flags (also known as feature toggles) allow you to enable or disable features in your
 * application without deploying new code.
 * 
 * ## Installation
 * 
 * ```bash
 * npm install @flagvault/sdk
 * # or
 * yarn add @flagvault/sdk
 * ```
 * 
 * ## Basic Usage
 * 
 * ```typescript
 * import FlagVaultSDK from '@flagvault/sdk';
 * 
 * const sdk = new FlagVaultSDK({
 *   apiKey: 'your-api-key',
 *   apiSecret: 'your-api-secret'
 * });
 * 
 * // Check if a feature flag is enabled
 * const isEnabled = await sdk.isEnabled('my-feature-flag');
 * if (isEnabled) {
 *   // Feature is enabled, run feature code
 * } else {
 *   // Feature is disabled, run fallback code
 * }
 * ```
 * 
 * ## Error Handling
 * 
 * ```typescript
 * try {
 *   const isEnabled = await sdk.isEnabled('my-feature-flag');
 *   // ...
 * } catch (error) {
 *   // Handle error (network issues, invalid API credentials, etc.)
 *   console.error('Error checking feature flag:', error);
 * }
 * ```
 * 
 * @group Core
 */
class FlagVaultSDK {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  /**
   * Creates a new instance of the FlagVault SDK.
   * 
   * @param config - Configuration options for the SDK
   * @throws Error if apiKey or apiSecret is not provided
   */
  constructor(config: FlagVaultSDKConfig) {
    const { apiKey, apiSecret, baseUrl = "https://api.flagvault.com" } = config;

    if (!apiKey || !apiSecret) {
      throw new Error("API Key and Secret are required to initialize the SDK.");
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

  /**
   * Checks if a feature flag is enabled.
   * 
   * @param flagId - The unique identifier for the feature flag
   * @returns A promise that resolves to a boolean indicating if the feature is enabled
   * @throws Error if flagId is not provided
   * @throws Error if the API request fails
   */
  async isEnabled(flagId: string): Promise<boolean> {
    if (!flagId) {
      throw new Error("flagId is required to check if a feature is enabled.");
    }

    const url = `${this.baseUrl}/feature-flag/${flagId}/enabled`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": this.apiKey,
        "X-API-Secret": this.apiSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.enabled;
  }
}

export default FlagVaultSDK;
