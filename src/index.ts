/**
 * Base exception for FlagVault SDK errors.
 */
export class FlagVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlagVaultError';
  }
}

/**
 * Raised when authentication fails.
 */
export class FlagVaultAuthenticationError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = 'FlagVaultAuthenticationError';
  }
}

/**
 * Raised when network requests fail.
 */
export class FlagVaultNetworkError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = 'FlagVaultNetworkError';
  }
}

/**
 * Raised when the API returns an error response.
 */
export class FlagVaultAPIError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = 'FlagVaultAPIError';
  }
}

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

  /**
   * Request timeout in milliseconds.
   * Defaults to 10000ms (10 seconds).
   */
  timeout?: number;
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
 * import FlagVaultSDK, {
 *   FlagVaultAuthenticationError,
 *   FlagVaultNetworkError,
 *   FlagVaultAPIError
 * } from '@flagvault/sdk';
 *
 * try {
 *   const isEnabled = await sdk.isEnabled('my-feature-flag');
 *   // ...
 * } catch (error) {
 *   if (error instanceof FlagVaultAuthenticationError) {
 *     // Handle authentication errors
 *     console.error('Invalid API credentials');
 *   } else if (error instanceof FlagVaultNetworkError) {
 *     // Handle network errors
 *     console.error('Network connection failed');
 *   } else if (error instanceof FlagVaultAPIError) {
 *     // Handle API errors
 *     console.error('API error occurred:', error.message);
 *   } else {
 *     // Handle unexpected errors
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * ```
 *
 * @group Core
 */
class FlagVaultSDK {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeout: number;

  /**
   * Creates a new instance of the FlagVault SDK.
   *
   * @param config - Configuration options for the SDK
   * @throws Error if apiKey or apiSecret is not provided
   */
  constructor(config: FlagVaultSDKConfig) {
    const { apiKey, apiSecret, baseUrl = "https://api.flagvault.com", timeout = 10000 } = config;

    if (!apiKey || !apiSecret) {
      throw new Error("API Key and Secret are required to initialize the SDK.");
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Checks if a feature flag is enabled.
   *
   * @param flagKey - The key for the feature flag
   * @returns A promise that resolves to a boolean indicating if the feature is enabled
   * @throws Error if flagKey is not provided
   * @throws FlagVaultAuthenticationError if authentication fails
   * @throws FlagVaultNetworkError if the network request fails
   * @throws FlagVaultAPIError if the API returns an error
   */
  async isEnabled(flagKey: string): Promise<boolean> {
    if (!flagKey) {
      throw new Error("flagKey is required to check if a feature is enabled.");
    }

    const url = `${this.baseUrl}/feature-flag/${flagKey}/enabled`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
          "X-API-Secret": this.apiSecret,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        throw new FlagVaultAuthenticationError("Invalid API credentials");
      } else if (response.status === 403) {
        throw new FlagVaultAuthenticationError("Access forbidden - check your API credentials");
      }

      // Handle other HTTP errors
      if (!response.ok) {
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new FlagVaultAPIError(`API request failed: ${errorMessage}`);
      }

      // Parse successful response
      let data: any;
      try {
        data = await response.json();
      } catch (error) {
        throw new FlagVaultAPIError(`Invalid JSON response: ${error}`);
      }

      return data.enabled ?? false;

    } catch (error) {
      if (error instanceof FlagVaultError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new FlagVaultNetworkError(`Request timed out after ${this.timeout}ms`);
      }

      if (error instanceof TypeError) {
        throw new FlagVaultNetworkError("Failed to connect to FlagVault API");
      }

      throw new FlagVaultNetworkError(`Network error: ${error}`);
    }
  }
}

export default FlagVaultSDK;
