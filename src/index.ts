/**
 * Base exception for FlagVault SDK errors.
 */
export class FlagVaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlagVaultError";
  }
}

/**
 * Raised when authentication fails.
 */
export class FlagVaultAuthenticationError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = "FlagVaultAuthenticationError";
  }
}

/**
 * Raised when network requests fail.
 */
export class FlagVaultNetworkError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = "FlagVaultNetworkError";
  }
}

/**
 * Raised when the API returns an error response.
 */
export class FlagVaultAPIError extends FlagVaultError {
  constructor(message: string) {
    super(message);
    this.name = "FlagVaultAPIError";
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
   * Environment is automatically determined from the key prefix (live_ = production, test_ = test).
   */
  apiKey: string;

  /**
   * Request timeout in milliseconds.
   * Defaults to 10000ms (10 seconds).
   */
  timeout?: number;

  /**
   * @internal
   * Base URL for the FlagVault API.
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
 *   apiKey: 'live_your-api-key-here'  // Use 'test_' prefix for test environment
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
 * ## Graceful Error Handling
 *
 * The SDK automatically handles errors gracefully by returning default values:
 *
 * ```typescript
 * // No try/catch needed - errors are handled gracefully
 * const isEnabled = await sdk.isEnabled('my-feature-flag', false);
 *
 * // On network error, you'll see:
 * // FlagVault: Failed to connect to API for flag 'my-feature-flag', using default: false
 *
 * // On authentication error:
 * // FlagVault: Invalid API credentials for flag 'my-feature-flag', using default: false
 *
 * // On missing flag:
 * // FlagVault: Flag 'my-feature-flag' not found, using default: false
 * ```
 *
 * ## Advanced Error Handling
 *
 * For custom error handling, you can still catch exceptions for parameter validation:
 *
 * ```typescript
 * try {
 *   const isEnabled = await sdk.isEnabled('my-feature-flag', false);
 *   // ...
 * } catch (error) {
 *   // Only throws for invalid parameters (empty flagKey)
 *   console.error('Parameter validation error:', error.message);
 * }
 * ```
 *
 * @group Core
 */
class FlagVaultSDK {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  /**
   * Creates a new instance of the FlagVault SDK.
   *
   * @param config - Configuration options for the SDK
   * @throws Error if apiKey is not provided
   */
  constructor(config: FlagVaultSDKConfig) {
    const {
      apiKey,
      baseUrl = "https://api.flagvault.com",
      timeout = 10000,
    } = config;

    if (!apiKey) {
      throw new Error("API Key is required to initialize the SDK.");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Checks if a feature flag is enabled.
   *
   * @param flagKey - The key for the feature flag
   * @param defaultValue - Default value to return on error (defaults to false)
   * @returns A promise that resolves to a boolean indicating if the feature is enabled
   * @throws Error if flagKey is not provided
   */
  async isEnabled(
    flagKey: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    if (!flagKey) {
      throw new Error("flagKey is required to check if a feature is enabled.");
    }

    const url = `${this.baseUrl}/api/feature-flag/${flagKey}/enabled`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        console.warn(
          `FlagVault: Invalid API credentials for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      } else if (response.status === 403) {
        console.warn(
          `FlagVault: Access forbidden for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      }

      // Handle flag not found
      if (response.status === 404) {
        console.warn(
          `FlagVault: Flag '${flagKey}' not found, using default: ${defaultValue}`,
        );
        return defaultValue;
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
        console.warn(
          `FlagVault: API error for flag '${flagKey}' (${errorMessage}), using default: ${defaultValue}`,
        );
        return defaultValue;
      }

      // Parse successful response
      let data: { enabled?: boolean };
      try {
        data = await response.json();
      } catch {
        console.warn(
          `FlagVault: Invalid JSON response for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      }

      return data.enabled ?? false;
    } catch (error) {
      // Handle network and timeout errors gracefully
      if (error instanceof DOMException && error.name === "AbortError") {
        console.warn(
          `FlagVault: Request timed out for flag '${flagKey}' after ${this.timeout}ms, using default: ${defaultValue}`,
        );
        return defaultValue;
      }

      if (error instanceof TypeError) {
        console.warn(
          `FlagVault: Failed to connect to API for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      }

      console.warn(
        `FlagVault: Network error for flag '${flagKey}' (${error}), using default: ${defaultValue}`,
      );
      return defaultValue;
    }
  }
}

export default FlagVaultSDK;

// React Hooks (requires React as peer dependency)
// These hooks are exported separately to avoid forcing React dependency for non-React users

/**
 * React hook return type for feature flag hooks.
 * @group React Hooks
 */
export interface UseFeatureFlagReturn {
  /** Whether the feature flag is enabled */
  isEnabled: boolean;
  /** Whether the hook is currently loading the flag status */
  isLoading: boolean;
  /** Any error that occurred while fetching the flag status */
  error: Error | null;
}

/**
 * React hook for checking feature flag status.
 *
 * @param sdk - FlagVault SDK instance
 * @param flagKey - The feature flag key to check
 * @param defaultValue - Default value to use if flag cannot be loaded
 * @returns Object containing isEnabled, isLoading, and error states
 *
 * @example
 * ```tsx
 * import FlagVaultSDK, { useFeatureFlag } from '@flagvault/sdk';
 *
 * const sdk = new FlagVaultSDK({ apiKey: 'live_your-api-key' });
 *
 * function MyComponent() {
 *   const { isEnabled, isLoading, error } = useFeatureFlag(sdk, 'new-feature', false);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   return isEnabled ? <NewFeature /> : <OldFeature />;
 * }
 * ```
 *
 * @group React Hooks
 */
export function useFeatureFlag(
  sdk: FlagVaultSDK,
  flagKey: string,
  defaultValue: boolean = false,
): UseFeatureFlagReturn {
  // Note: This requires React to be installed as a peer dependency
  // We use a try/catch to gracefully handle cases where React is not available
  try {
    // Use any to avoid TypeScript errors with dynamic imports
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
    const React: any = require("react");
    const { useState, useEffect } = React;

    const [isEnabled, setIsEnabled] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null as Error | null);

    useEffect(() => {
      let isMounted = true;

      async function checkFlag() {
        try {
          setIsLoading(true);
          const enabled = await sdk.isEnabled(flagKey, defaultValue);

          if (isMounted) {
            setIsEnabled(enabled);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            const errorObj =
              err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            setIsEnabled(defaultValue);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      checkFlag();

      return () => {
        isMounted = false;
      };
    }, [sdk, flagKey, defaultValue]);

    return { isEnabled, isLoading, error };
  } catch {
    throw new Error(
      "useFeatureFlag requires React to be installed as a peer dependency. " +
        "Please install React: npm install react",
    );
  }
}

/**
 * React hook for checking feature flag status with caching.
 * Reduces API calls by caching flag values for a specified TTL.
 *
 * @param sdk - FlagVault SDK instance
 * @param flagKey - The feature flag key to check
 * @param defaultValue - Default value to use if flag cannot be loaded
 * @param cacheTTL - Cache time-to-live in milliseconds (default: 5 minutes)
 * @returns Object containing isEnabled, isLoading, and error states
 *
 * @example
 * ```tsx
 * import FlagVaultSDK, { useFeatureFlagCached } from '@flagvault/sdk';
 *
 * const sdk = new FlagVaultSDK({ apiKey: 'live_your-api-key' });
 *
 * function MyComponent() {
 *   const { isEnabled, isLoading } = useFeatureFlagCached(
 *     sdk,
 *     'new-feature',
 *     false,
 *     300000 // 5 minutes cache
 *   );
 *
 *   return isEnabled ? <NewFeature /> : <OldFeature />;
 * }
 * ```
 *
 * @group React Hooks
 */
export function useFeatureFlagCached(
  sdk: FlagVaultSDK,
  flagKey: string,
  defaultValue: boolean = false,
  cacheTTL: number = 5 * 60 * 1000, // 5 minutes
): UseFeatureFlagReturn {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
    const React: any = require("react");
    const { useState, useEffect } = React;

    const [isEnabled, setIsEnabled] = useState(defaultValue);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null as Error | null);

    useEffect(() => {
      let isMounted = true;

      async function checkFlag() {
        try {
          setIsLoading(true);

          // Check cache first
          const cacheKey = `flagvault_${flagKey}`;
          const cachedData = getCachedFlag(cacheKey, cacheTTL);

          if (cachedData !== null) {
            if (isMounted) {
              setIsEnabled(cachedData);
              setError(null);
              setIsLoading(false);
            }
            return;
          }

          // Fetch from API
          const enabled = await sdk.isEnabled(flagKey, defaultValue);

          // Update cache
          setCachedFlag(cacheKey, enabled);

          if (isMounted) {
            setIsEnabled(enabled);
            setError(null);
          }
        } catch (err) {
          if (isMounted) {
            const errorObj =
              err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            setIsEnabled(defaultValue);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      checkFlag();

      return () => {
        isMounted = false;
      };
    }, [sdk, flagKey, defaultValue, cacheTTL]);

    return { isEnabled, isLoading, error };
  } catch {
    throw new Error(
      "useFeatureFlagCached requires React to be installed as a peer dependency. " +
        "Please install React: npm install react",
    );
  }
}

// Simple in-memory cache for React hooks
const flagCache = new Map<string, { value: boolean; timestamp: number }>();

function getCachedFlag(key: string, ttl: number): boolean | null {
  const cached = flagCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > ttl) {
    flagCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedFlag(key: string, value: boolean): void {
  flagCache.set(key, { value, timestamp: Date.now() });
}
