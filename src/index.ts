import * as crypto from "crypto";

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
 * Feature flag metadata returned from the API.
 *
 * @group Core
 */
export interface FeatureFlagMetadata {
  /** The flag key */
  key: string;
  /** Whether the flag is enabled */
  isEnabled: boolean;
  /** Display name of the flag */
  name: string;
  /** Percentage of users to enable (0-100) */
  rolloutPercentage?: number | null;
  /** Random seed for consistent rollout */
  rolloutSeed?: string | null;
}

/**
 * Cache configuration options for the FlagVault SDK.
 *
 * @group Configuration
 */
export interface CacheConfig {
  /**
   * Enable or disable caching.
   * Defaults to true.
   */
  enabled?: boolean;

  /**
   * Cache time-to-live in seconds.
   * Defaults to 300 seconds (5 minutes).
   */
  ttl?: number;

  /**
   * Maximum number of flags to cache.
   * Defaults to 1000.
   */
  maxSize?: number;

  /**
   * Background refresh interval in seconds.
   * Set to 0 to disable background refresh.
   * Defaults to 60 seconds.
   */
  refreshInterval?: number;

  /**
   * Fallback behavior when cache is empty and API fails.
   * - 'api': Retry API call (may throw)
   * - 'default': Return default value
   * - 'throw': Throw the error
   * Defaults to 'default'.
   */
  fallbackBehavior?: "api" | "default" | "throw";
}

/**
 * Cache entry for storing flag data.
 * @internal
 */
interface CacheEntry {
  /** The flag value */
  value: boolean;
  /** When the entry was cached (timestamp) */
  cachedAt: number;
  /** When the entry expires (timestamp) */
  expiresAt: number;
  /** Last time the entry was accessed (for LRU) */
  lastAccessed: number;
}

/**
 * Cache statistics for monitoring and debugging.
 *
 * @group Debugging
 */
export interface CacheStats {
  /** Current number of cached flags */
  size: number;
  /** Cache hit rate as a percentage (0-1) */
  hitRate: number;
  /** Number of expired entries */
  expiredEntries: number;
  /** Estimated memory usage in bytes */
  memoryUsage: number;
}

/**
 * Debug information for a specific flag.
 *
 * @group Debugging
 */
export interface FlagDebugInfo {
  /** The flag key */
  flagKey: string;
  /** Whether the flag is currently cached */
  cached: boolean;
  /** The cached value (if any) */
  value?: boolean;
  /** When the flag was cached */
  cachedAt?: number;
  /** When the flag expires */
  expiresAt?: number;
  /** Time until expiry in milliseconds */
  timeUntilExpiry?: number;
  /** Last access time */
  lastAccessed?: number;
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

  /**
   * Cache configuration options.
   * Defaults to enabled with 5-minute TTL.
   */
  cache?: CacheConfig;
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
  private cacheConfig: Required<CacheConfig>;
  private cache: Map<string, CacheEntry>;
  private refreshTimer?: NodeJS.Timeout;
  private refreshInProgress: boolean = false;
  private bulkFlagsCache?: {
    flags: Map<string, FeatureFlagMetadata>;
    cachedAt: number;
    expiresAt: number;
  };

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
      cache = {},
    } = config;

    if (!apiKey) {
      throw new Error("API Key is required to initialize the SDK.");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.timeout = timeout;

    // Initialize cache configuration with defaults
    this.cacheConfig = {
      enabled: cache.enabled ?? true,
      ttl: cache.ttl ?? 300,
      maxSize: cache.maxSize ?? 1000,
      refreshInterval: cache.refreshInterval ?? 60,
      fallbackBehavior: cache.fallbackBehavior ?? "default",
    };

    // Initialize cache
    this.cache = new Map();

    // Start background refresh if enabled
    if (this.cacheConfig.enabled && this.cacheConfig.refreshInterval > 0) {
      this.startBackgroundRefresh();
    }
  }

  /**
   * Stops background refresh and cleans up resources.
   * Call this when you're done with the SDK instance.
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.cache.clear();
  }

  /**
   * Checks if a feature flag is enabled.
   *
   * @param flagKey - The key for the feature flag
   * @param defaultValue - Default value to return on error (defaults to false)
   * @param context - Optional context ID for percentage rollouts (e.g., userId, sessionId)
   * @deprecated The context parameter is deprecated. Use targetId instead.
   * @returns A promise that resolves to a boolean indicating if the feature is enabled
   * @throws Error if flagKey is not provided
   */
  async isEnabled(
    flagKey: string,
    defaultValue?: boolean,
    context?: string,
  ): Promise<boolean>;

  /**
   * Checks if a feature flag is enabled.
   *
   * @param flagKey - The key for the feature flag
   * @param defaultValue - Default value to return on error (defaults to false)
   * @param options - Optional configuration object
   * @param options.targetId - Target identifier for percentage rollouts (e.g., userId, sessionId)
   * @returns A promise that resolves to a boolean indicating if the feature is enabled
   * @throws Error if flagKey is not provided
   */
  async isEnabled(
    flagKey: string,
    defaultValue?: boolean,
    options?: { targetId?: string },
  ): Promise<boolean>;

  async isEnabled(
    flagKey: string,
    defaultValue: boolean = false,
    contextOrOptions?: string | { targetId?: string },
  ): Promise<boolean> {
    if (!flagKey) {
      throw new Error("flagKey is required to check if a feature is enabled.");
    }

    // Extract targetId from parameters
    let targetId: string | undefined;
    if (typeof contextOrOptions === "string") {
      // Legacy context parameter
      targetId = contextOrOptions;
      console.warn(
        "FlagVault: The context parameter is deprecated. Please use { targetId } instead.",
      );
    } else if (contextOrOptions && typeof contextOrOptions === "object") {
      // New options format
      targetId = contextOrOptions.targetId;
    }

    // Check bulk cache first if available
    if (this.cacheConfig.enabled && this.bulkFlagsCache) {
      const now = Date.now();
      if (now < this.bulkFlagsCache.expiresAt) {
        const flag = this.bulkFlagsCache.flags.get(flagKey);
        if (flag) {
          return this.evaluateFlag(flag, targetId);
        }
      }
    }

    // Check individual cache if enabled (include targetId in cache key)
    const cacheKey = targetId ? `${flagKey}:${targetId}` : flagKey;
    if (this.cacheConfig.enabled) {
      const cachedValue = this.getCachedValue(cacheKey);
      if (cachedValue !== null) {
        return cachedValue;
      }
    }

    // Cache miss - fetch from API
    try {
      const { value, shouldCache } = await this.fetchFlagFromApiWithCacheInfo(
        flagKey,
        defaultValue,
        targetId,
      );

      // Store in cache if enabled and the response was successful
      if (this.cacheConfig.enabled && shouldCache) {
        this.setCachedValue(cacheKey, value);
      }

      return value;
    } catch (error) {
      return this.handleCacheMiss(flagKey, defaultValue, error);
    }
  }

  /**
   * Fetches a flag value from the API with cache information.
   * @private
   */
  private async fetchFlagFromApiWithCacheInfo(
    flagKey: string,
    defaultValue: boolean,
    targetId?: string,
  ): Promise<{ value: boolean; shouldCache: boolean }> {
    let url = `${this.baseUrl}/api/feature-flag/${flagKey}/enabled`;
    if (targetId) {
      url += `?targetId=${encodeURIComponent(targetId)}`;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors - don't cache
      if (response.status === 401) {
        console.warn(
          `FlagVault: Invalid API credentials for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      } else if (response.status === 403) {
        console.warn(
          `FlagVault: Access forbidden for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      // Handle flag not found - don't cache
      if (response.status === 404) {
        console.warn(
          `FlagVault: Flag '${flagKey}' not found, using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      // Handle other HTTP errors - don't cache
      if (!response.ok) {
        let errorMessage: string;
        try {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.warn(
          `FlagVault: API error for flag '${flagKey}' (${errorMessage}), using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      // Parse JSON response
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        console.warn(
          `FlagVault: Invalid JSON response for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      // Extract enabled value and cache successful responses
      const enabled = (data as { enabled?: boolean })?.enabled ?? false;
      return { value: enabled, shouldCache: true };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle network and timeout errors gracefully - don't cache
      if (error instanceof DOMException && error.name === "AbortError") {
        console.warn(
          `FlagVault: Request timed out for flag '${flagKey}' after ${this.timeout}ms, using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      if (error instanceof TypeError) {
        console.warn(
          `FlagVault: Failed to connect to API for flag '${flagKey}', using default: ${defaultValue}`,
        );
        return { value: defaultValue, shouldCache: false };
      }

      console.warn(
        `FlagVault: Network error for flag '${flagKey}' (${error}), using default: ${defaultValue}`,
      );
      return { value: defaultValue, shouldCache: false };
    }
  }

  /**
   * Fetches a flag value from the API.
   * @private
   */
  private async fetchFlagFromApi(
    flagKey: string,
    defaultValue: boolean,
    targetId?: string,
  ): Promise<boolean> {
    const { value } = await this.fetchFlagFromApiWithCacheInfo(
      flagKey,
      defaultValue,
      targetId,
    );
    return value;
  }

  /**
   * Gets a cached flag value if it exists and is not expired.
   * @private
   */
  private getCachedValue(flagKey: string): boolean | null {
    const entry = this.cache.get(flagKey);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(flagKey);
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = now;
    return entry.value;
  }

  /**
   * Sets a flag value in the cache.
   * @private
   */
  private setCachedValue(flagKey: string, value: boolean): void {
    // Check if cache is full and evict oldest entry
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictOldestEntry();
    }

    const now = Date.now();
    const entry: CacheEntry = {
      value,
      cachedAt: now,
      expiresAt: now + this.cacheConfig.ttl * 1000,
      lastAccessed: now,
    };

    this.cache.set(flagKey, entry);
  }

  /**
   * Evicts the least recently used entry from the cache.
   * @private
   */
  private evictOldestEntry(): void {
    let oldestKey = "";
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Handles cache miss scenarios based on configured fallback behavior.
   * @private
   */
  private handleCacheMiss(
    flagKey: string,
    defaultValue: boolean,
    error: unknown,
  ): boolean {
    switch (this.cacheConfig.fallbackBehavior) {
      case "default":
        console.warn(
          `FlagVault: Cache miss for '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      case "throw":
        throw error;
      case "api":
        // This would retry the API call, but for now we'll return default
        console.warn(
          `FlagVault: Cache miss for '${flagKey}', using default: ${defaultValue}`,
        );
        return defaultValue;
      default:
        return defaultValue;
    }
  }

  /**
   * Starts the background refresh timer.
   * @private
   */
  private startBackgroundRefresh(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.refreshInProgress) {
        this.refreshExpiredFlags();
      }
    }, this.cacheConfig.refreshInterval * 1000);
  }

  /**
   * Refreshes flags that are about to expire.
   * @private
   */
  private async refreshExpiredFlags(): Promise<void> {
    this.refreshInProgress = true;

    try {
      const now = Date.now();
      const flagsToRefresh: string[] = [];

      // Find flags that will expire in the next 30 seconds
      // Only refresh flags without context (basic flag keys)
      for (const [flagKey, entry] of this.cache.entries()) {
        const timeUntilExpiry = entry.expiresAt - now;
        if (timeUntilExpiry <= 30000 && !flagKey.includes(":")) {
          // 30 seconds, no context
          flagsToRefresh.push(flagKey);
        }
      }

      if (flagsToRefresh.length > 0) {
        // Refresh flags in the background
        await Promise.allSettled(
          flagsToRefresh.map(async (flagKey) => {
            try {
              const { value, shouldCache } =
                await this.fetchFlagFromApiWithCacheInfo(flagKey, false);
              if (shouldCache) {
                this.setCachedValue(flagKey, value);
              }
            } catch (error) {
              // Background refresh failed, but don't remove from cache
              console.warn(
                `FlagVault: Background refresh failed for '${flagKey}':`,
                error,
              );
            }
          }),
        );
      }
    } catch (error) {
      console.warn("FlagVault: Background refresh failed:", error);
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Gets cache statistics for monitoring and debugging.
   *
   * @returns Object containing cache statistics
   */
  getCacheStats(): CacheStats {
    let hitCount = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      if (entry.lastAccessed > entry.cachedAt) {
        hitCount++;
      }
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? hitCount / this.cache.size : 0,
      expiredEntries: expiredCount,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Gets debug information for a specific flag.
   *
   * @param flagKey - The flag key to debug
   * @returns Debug information about the flag
   */
  debugFlag(flagKey: string): FlagDebugInfo {
    const entry = this.cache.get(flagKey);
    const now = Date.now();

    return {
      flagKey,
      cached: !!entry,
      value: entry?.value,
      cachedAt: entry?.cachedAt,
      expiresAt: entry?.expiresAt,
      timeUntilExpiry: entry ? entry.expiresAt - now : undefined,
      lastAccessed: entry?.lastAccessed,
    };
  }

  /**
   * Clears the entire cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Estimates memory usage of the cache.
   * @private
   */
  private estimateMemoryUsage(): number {
    // Rough estimation: each entry has a key (string) + CacheEntry object
    // String: ~2 bytes per character, CacheEntry: ~32 bytes for numbers
    let total = 0;
    for (const key of this.cache.keys()) {
      total += key.length * 2 + 32; // Rough estimate
    }
    return total;
  }

  /**
   * Fetches all feature flags for the organization.
   *
   * @returns A promise that resolves to a map of flag keys to flag metadata
   * @throws Error on network or API errors
   */
  async getAllFlags(): Promise<Map<string, FeatureFlagMetadata>> {
    // Check bulk cache first
    if (this.cacheConfig.enabled && this.bulkFlagsCache) {
      const now = Date.now();
      if (now < this.bulkFlagsCache.expiresAt) {
        return new Map(this.bulkFlagsCache.flags);
      }
    }

    const url = `${this.baseUrl}/api/feature-flag`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-Key": this.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FlagVaultAPIError(
          `Failed to fetch flags: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      const flags = new Map<string, FeatureFlagMetadata>();

      if (data.flags && Array.isArray(data.flags)) {
        for (const flag of data.flags) {
          flags.set(flag.key, flag);
        }
      }

      // Cache the bulk response
      if (this.cacheConfig.enabled) {
        const now = Date.now();
        this.bulkFlagsCache = {
          flags: new Map(flags),
          cachedAt: now,
          expiresAt: now + this.cacheConfig.ttl * 1000,
        };
      }

      return flags;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new FlagVaultNetworkError(
          `Request timed out after ${this.timeout}ms`,
        );
      }

      if (error instanceof TypeError) {
        throw new FlagVaultNetworkError("Failed to connect to API");
      }

      throw error;
    }
  }

  /**
   * Evaluates a feature flag for a specific context using local rollout logic.
   * @private
   */
  private evaluateFlag(flag: FeatureFlagMetadata, targetId?: string): boolean {
    // If flag is disabled, always return false
    if (!flag.isEnabled) {
      return false;
    }

    // If no rollout percentage set, return the flag's enabled state
    if (flag.rolloutPercentage == null || flag.rolloutSeed == null) {
      return flag.isEnabled;
    }

    // Use provided targetId or generate a random one
    const rolloutTargetId = targetId || crypto.randomBytes(16).toString("hex");

    // Calculate consistent hash for this targetId + flag combination
    const hash = crypto
      .createHash("sha256")
      .update(`${rolloutTargetId}-${flag.key}-${flag.rolloutSeed}`)
      .digest();

    // Convert first 2 bytes to a number between 0-9999 (for 0.01% precision)
    const bucket = (hash[0] * 256 + hash[1]) % 10000;

    // Check if this targetId is in the rollout percentage
    const threshold = flag.rolloutPercentage * 100; // Convert percentage to 0-10000 scale

    return bucket < threshold;
  }

  /**
   * Preloads all feature flags into cache.
   * Useful for applications that need to evaluate many flags quickly.
   *
   * @returns A promise that resolves when flags are loaded
   */
  async preloadFlags(): Promise<void> {
    await this.getAllFlags();
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
 * @param targetId - Optional target identifier for percentage rollouts (e.g., userId, sessionId)
 * @returns Object containing isEnabled, isLoading, and error states
 *
 * @example
 * ```tsx
 * import FlagVaultSDK, { useFeatureFlag } from '@flagvault/sdk';
 *
 * const sdk = new FlagVaultSDK({ apiKey: 'live_your-api-key' });
 *
 * function MyComponent() {
 *   const { isEnabled, isLoading, error } = useFeatureFlag(sdk, 'new-feature', false, 'user-123');
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
  targetId?: string,
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
          const enabled = await sdk.isEnabled(flagKey, defaultValue, {
            targetId,
          });

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
    }, [sdk, flagKey, defaultValue, targetId]);

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
 * @param targetId - Optional target identifier for percentage rollouts (e.g., userId, sessionId)
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
 *     300000, // 5 minutes cache
 *     'user-123'
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
  targetId?: string,
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

          // Check cache first (include targetId in cache key)
          const cacheKey = targetId
            ? `flagvault_${flagKey}:${targetId}`
            : `flagvault_${flagKey}`;
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
          const enabled = await sdk.isEnabled(flagKey, defaultValue, {
            targetId,
          });

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
    }, [sdk, flagKey, defaultValue, cacheTTL, targetId]);

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
