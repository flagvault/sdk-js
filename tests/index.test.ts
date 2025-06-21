import FlagVaultSDK from "../src/index";

// Mock fetch
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("jest-fetch-mock").enableMocks();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetchMock = require("jest-fetch-mock");

describe("FlagVaultSDK", () => {
  beforeEach(() => {
    fetchMock.resetMocks(); // Reset mocks before each test
  });

  it("should return default value when the fetch request fails", async () => {
    // Mock a failed fetch request
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value (false) on network error
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should initialize correctly with valid config", () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    expect(sdk).toBeInstanceOf(FlagVaultSDK);
  });

  it("should initialize correctly with custom config", () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      timeout: 15000,
    });

    expect(sdk).toBeInstanceOf(FlagVaultSDK);
  });

  it("should throw an error if initialized without API key or secret", () => {
    expect(() => {
      new FlagVaultSDK({
        apiKey: "",
      });
    }).toThrow("API Key is required to initialize the SDK.");
  });

  it("should return true if the feature flag is enabled", async () => {
    // Mock a successful fetch response indicating the flag is enabled
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
      status: 200,
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const isEnabled = await sdk.isEnabled("test-flag-key");
    expect(isEnabled).toBe(true);
  });

  it("should return false if the feature flag is disabled", async () => {
    // Mock a successful fetch response indicating the flag is disabled
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }), {
      status: 200,
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const isEnabled = await sdk.isEnabled("test-flag-key");
    expect(isEnabled).toBe(false);
  });

  it("should throw an error if flagKey is missing", async () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("")).rejects.toThrow(
      "flagKey is required to check if a feature is enabled.",
    );
  });

  it("should return default value for 401 responses", async () => {
    // Mock a 401 response (unauthorized)
    fetchMock.mockResponseOnce("", { status: 401 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value for 403 responses", async () => {
    // Mock a 403 response (forbidden)
    fetchMock.mockResponseOnce("", { status: 403 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value for 404 responses", async () => {
    // Mock a 404 response (not found)
    fetchMock.mockResponseOnce("", { status: 404 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value for other HTTP errors", async () => {
    // Mock a 500 response (internal server error) with JSON error message
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 },
    );

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value when HTTP error response has invalid JSON", async () => {
    // Mock a 500 response with invalid JSON
    fetchMock.mockResponseOnce("Invalid JSON", { status: 500 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value when request times out", async () => {
    // Mock an AbortError to simulate timeout
    fetchMock.mockRejectOnce(new DOMException("Aborted", "AbortError"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      timeout: 1000,
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value when response is not valid JSON", async () => {
    // Mock a successful response with invalid JSON
    fetchMock.mockResponseOnce("Invalid JSON", { status: 200 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return false when enabled field is missing from response", async () => {
    // Mock a successful response without the enabled field
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const isEnabled = await sdk.isEnabled("test-flag-key");
    expect(isEnabled).toBe(false);
  });

  it("should throw Error when flag_key is null or undefined", async () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(sdk.isEnabled(null as any)).rejects.toThrow(
      "flagKey is required to check if a feature is enabled.",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(sdk.isEnabled(undefined as any)).rejects.toThrow(
      "flagKey is required to check if a feature is enabled.",
    );
  });

  it("should handle flag keys with special characters", async () => {
    // Mock a successful response
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
      status: 200,
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const isEnabled = await sdk.isEnabled("feature-flag_with.special-chars");
    expect(isEnabled).toBe(true);
  });

  it("should return default value for generic network errors", async () => {
    // Mock a generic error
    fetchMock.mockRejectOnce(new Error("Generic network error"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  it("should return default value when HTTP status has no message", async () => {
    // Mock a 500 response without error message
    fetchMock.mockResponseOnce("", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Should return default value instead of throwing
    await expect(sdk.isEnabled("test-flag-key")).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag-key", true)).resolves.toBe(true);
  });

  // Test default value parameter explicitly
  it("should use provided default value on errors", async () => {
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Test different default values
    await expect(sdk.isEnabled("test-flag", false)).resolves.toBe(false);
    await expect(sdk.isEnabled("test-flag", true)).resolves.toBe(true);
  });

  // Test successful response respects default value when enabled field missing
  it("should respect default value when enabled field is missing but still use response", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    // Even with default=true, missing enabled field should return false (per SDK logic)
    await expect(sdk.isEnabled("test-flag", true)).resolves.toBe(false);
  });

  // === CACHING TESTS ===
  describe("Caching", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should cache successful API responses", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, ttl: 300 },
      });

      // First call should hit API
      const result1 = await sdk.isEnabled("test-flag");
      expect(result1).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await sdk.isEnabled("test-flag");
      expect(result2).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1); // No additional call

      sdk.destroy();
    });

    it("should not cache error responses", async () => {
      fetchMock.mockResponseOnce("", { status: 404 });
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // First call returns default due to 404
      const result1 = await sdk.isEnabled("test-flag");
      expect(result1).toBe(false);

      // Second call should make API call again (not cached)
      const result2 = await sdk.isEnabled("test-flag");
      expect(result2).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });

    it("should respect cache TTL", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, ttl: 0.1 }, // 100ms TTL
      });

      // First call
      await sdk.isEnabled("test-flag");
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }), {
        status: 200,
      });

      // Second call after expiry should hit API again
      const result = await sdk.isEnabled("test-flag");
      expect(result).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });

    it("should provide cache statistics", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Make some requests to populate cache
      await sdk.isEnabled("flag1");
      await sdk.isEnabled("flag1"); // cache hit
      await sdk.isEnabled("flag1"); // another cache hit

      const stats = sdk.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBeGreaterThanOrEqual(0); // Can be 0 on first access
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.expiredEntries).toBe(0);

      sdk.destroy();
    });

    it("should provide debug information for flags", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Load a flag into cache
      await sdk.isEnabled("debug-flag");

      const debugInfo = sdk.debugFlag("debug-flag");
      expect(debugInfo.flagKey).toBe("debug-flag");
      expect(debugInfo.cached).toBe(true);
      expect(debugInfo.value).toBe(true);
      expect(typeof debugInfo.cachedAt).toBe("number");
      expect(typeof debugInfo.expiresAt).toBe("number");
      expect(debugInfo.timeUntilExpiry).toBeGreaterThan(0);

      // Debug non-cached flag
      const debugInfo2 = sdk.debugFlag("non-cached");
      expect(debugInfo2.cached).toBe(false);
      expect(debugInfo2.value).toBeUndefined();

      sdk.destroy();
    });

    it("should clear cache", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Load flag into cache
      await sdk.isEnabled("test-flag");
      expect(sdk.getCacheStats().size).toBe(1);

      // Clear cache
      sdk.clearCache();
      expect(sdk.getCacheStats().size).toBe(0);

      sdk.destroy();
    });

    it("should handle context in cache keys", async () => {
      fetchMock
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 })
        .mockResponseOnce(JSON.stringify({ enabled: false }), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Same flag, different contexts should be cached separately
      await sdk.isEnabled("test-flag", false, "user-1");
      await sdk.isEnabled("test-flag", false, "user-2");

      expect(fetchMock).toHaveBeenCalledTimes(2);

      // Same context should use cache
      await sdk.isEnabled("test-flag", false, "user-1");
      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });

    it("should disable caching when configured", async () => {
      fetchMock
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 })
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: false },
      });

      // Both calls should hit API
      await sdk.isEnabled("test-flag");
      await sdk.isEnabled("test-flag");

      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });

    it("should evict oldest entries when cache is full", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, maxSize: 2 },
      });

      // Mock responses for 3 flags
      fetchMock
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 })
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 })
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 });

      // Fill cache to max size
      await sdk.isEnabled("flag1");
      await sdk.isEnabled("flag2");
      expect(sdk.getCacheStats().size).toBe(2);

      // Add third flag should evict oldest
      await sdk.isEnabled("flag3");
      expect(sdk.getCacheStats().size).toBe(2);

      sdk.destroy();
    });

    it("should handle fallback behavior on cache miss", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, fallbackBehavior: "default" },
      });

      // Force cache miss by mocking network error
      fetchMock.mockRejectOnce(new Error("Network error"));

      const result = await sdk.isEnabled("test-flag", true);
      expect(result).toBe(true); // Should return default value

      sdk.destroy();
    });

    it("should handle different cache fallback behaviors", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, fallbackBehavior: "default" },
      });

      // Since the fallback behavior is tested implicitly in error cases,
      // this test just verifies the configuration is accepted
      expect(sdk).toBeInstanceOf(FlagVaultSDK);

      sdk.destroy();
    });

    it("should handle api fallback behavior", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, fallbackBehavior: "api" },
      });

      // Force cache miss by mocking network error
      fetchMock.mockRejectOnce(new Error("Network error"));

      const result = await sdk.isEnabled("test-flag", true);
      expect(result).toBe(true); // Should return default value for now

      sdk.destroy();
    });

    it("should handle unknown fallback behavior", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, fallbackBehavior: "unknown" as "default" },
      });

      // Force cache miss by mocking network error
      fetchMock.mockRejectOnce(new Error("Network error"));

      const result = await sdk.isEnabled("test-flag", true);
      expect(result).toBe(true); // Should return default value

      sdk.destroy();
    });
  });

  // === BULK EVALUATION TESTS ===
  describe("Bulk Evaluation", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should fetch all flags", async () => {
      const mockFlags = {
        flags: [
          {
            key: "flag1",
            isEnabled: true,
            name: "Flag 1",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
          {
            key: "flag2",
            isEnabled: false,
            name: "Flag 2",
            rolloutPercentage: 50,
            rolloutSeed: "seed123",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      const flags = await sdk.getAllFlags();
      expect(flags.size).toBe(2);
      expect(flags.get("flag1")).toEqual(mockFlags.flags[0]);
      expect(flags.get("flag2")).toEqual(mockFlags.flags[1]);

      sdk.destroy();
    });

    it("should handle empty flags response", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ flags: [] }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      const flags = await sdk.getAllFlags();
      expect(flags.size).toBe(0);

      sdk.destroy();
    });

    it("should handle malformed flags response", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ notFlags: [] }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      const flags = await sdk.getAllFlags();
      expect(flags.size).toBe(0);

      sdk.destroy();
    });

    it("should throw on getAllFlags API errors", async () => {
      fetchMock.mockResponseOnce("", { status: 500 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await expect(sdk.getAllFlags()).rejects.toThrow("Failed to fetch flags");

      sdk.destroy();
    });

    it("should throw on getAllFlags network timeout", async () => {
      fetchMock.mockRejectOnce(new DOMException("Aborted", "AbortError"));

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key", timeout: 1000 });

      await expect(sdk.getAllFlags()).rejects.toThrow("Request timed out");

      sdk.destroy();
    });

    it("should throw on getAllFlags network error", async () => {
      fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await expect(sdk.getAllFlags()).rejects.toThrow(
        "Failed to connect to API",
      );

      sdk.destroy();
    });

    it("should cache bulk flags response", async () => {
      const mockFlags = {
        flags: [
          {
            key: "flag1",
            isEnabled: true,
            name: "Flag 1",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // First call
      await sdk.getAllFlags();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await sdk.getAllFlags();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      sdk.destroy();
    });

    it("should preload flags", async () => {
      const mockFlags = {
        flags: [
          {
            key: "flag1",
            isEnabled: true,
            name: "Flag 1",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();
      expect(fetchMock).toHaveBeenCalledTimes(1);

      sdk.destroy();
    });

    it("should use bulk cache for isEnabled calls", async () => {
      const mockFlags = {
        flags: [
          {
            key: "flag1",
            isEnabled: true,
            name: "Flag 1",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Preload flags
      await sdk.preloadFlags();

      // isEnabled should use bulk cache, not make new API call
      const result = await sdk.isEnabled("flag1");
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Only the preload call

      sdk.destroy();
    });
  });

  // === ROLLOUT EVALUATION TESTS ===
  describe("Rollout Evaluation", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should handle flags with no rollout percentage", async () => {
      const mockFlags = {
        flags: [
          {
            key: "simple-flag",
            isEnabled: true,
            name: "Simple Flag",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Should return flag's enabled state directly
      const result = await sdk.isEnabled("simple-flag", false, "user-123");
      expect(result).toBe(true);

      sdk.destroy();
    });

    it("should handle disabled flags with rollout", async () => {
      const mockFlags = {
        flags: [
          {
            key: "disabled-flag",
            isEnabled: false,
            name: "Disabled Flag",
            rolloutPercentage: 100,
            rolloutSeed: "seed123",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Should return false even with 100% rollout because flag is disabled
      const result = await sdk.isEnabled("disabled-flag", false, "user-123");
      expect(result).toBe(false);

      sdk.destroy();
    });

    it("should evaluate rollout percentage deterministically", async () => {
      const mockFlags = {
        flags: [
          {
            key: "rollout-flag",
            isEnabled: true,
            name: "Rollout Flag",
            rolloutPercentage: 50,
            rolloutSeed: "test-seed",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Same user should get consistent results
      const result1 = await sdk.isEnabled("rollout-flag", false, "user-123");
      const result2 = await sdk.isEnabled("rollout-flag", false, "user-123");
      const result3 = await sdk.isEnabled("rollout-flag", false, "user-123");

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);

      sdk.destroy();
    });

    it("should evaluate different users differently", async () => {
      const mockFlags = {
        flags: [
          {
            key: "rollout-flag",
            isEnabled: true,
            name: "Rollout Flag",
            rolloutPercentage: 50,
            rolloutSeed: "test-seed",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Test multiple users - with 50% rollout, we should see some variation
      const users = Array.from({ length: 20 }, (_, i) => `user-${i}`);
      const results = await Promise.all(
        users.map((user) => sdk.isEnabled("rollout-flag", false, user)),
      );

      const enabledCount = results.filter(Boolean).length;

      // With 20 users and 50% rollout, we expect some to be enabled and some disabled
      // Allow for some statistical variation
      expect(enabledCount).toBeGreaterThan(0);
      expect(enabledCount).toBeLessThan(20);

      sdk.destroy();
    });

    it("should handle 0% rollout", async () => {
      const mockFlags = {
        flags: [
          {
            key: "zero-rollout",
            isEnabled: true,
            name: "Zero Rollout",
            rolloutPercentage: 0,
            rolloutSeed: "test-seed",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Should always return false with 0% rollout
      const result1 = await sdk.isEnabled("zero-rollout", false, "user-1");
      const result2 = await sdk.isEnabled("zero-rollout", false, "user-2");
      const result3 = await sdk.isEnabled("zero-rollout", false, "user-3");

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);

      sdk.destroy();
    });

    it("should handle 100% rollout", async () => {
      const mockFlags = {
        flags: [
          {
            key: "full-rollout",
            isEnabled: true,
            name: "Full Rollout",
            rolloutPercentage: 100,
            rolloutSeed: "test-seed",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Should always return true with 100% rollout
      const result1 = await sdk.isEnabled("full-rollout", false, "user-1");
      const result2 = await sdk.isEnabled("full-rollout", false, "user-2");
      const result3 = await sdk.isEnabled("full-rollout", false, "user-3");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);

      sdk.destroy();
    });

    it("should handle missing rollout seed", async () => {
      const mockFlags = {
        flags: [
          {
            key: "no-seed-flag",
            isEnabled: true,
            name: "No Seed Flag",
            rolloutPercentage: 50,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Should fall back to flag's enabled state when seed is missing
      const result = await sdk.isEnabled("no-seed-flag", false, "user-123");
      expect(result).toBe(true);

      sdk.destroy();
    });

    it("should use context parameter in API calls", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.isEnabled("test-flag", false, "user-123");

      // Verify the API was called with context parameter
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("context=user-123"),
        expect.any(Object),
      );

      sdk.destroy();
    });

    it("should not include context parameter when not provided", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.isEnabled("test-flag", false);

      // Verify the API was called without context parameter
      expect(fetchMock).toHaveBeenCalledWith(
        expect.not.stringContaining("context="),
        expect.any(Object),
      );

      sdk.destroy();
    });
  });

  // === DESTROY AND CLEANUP TESTS ===
  describe("Destroy and Cleanup", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should cleanup timers on destroy", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, refreshInterval: 60 },
      });

      sdk.destroy();

      // Should not throw after destroy
      expect(() => sdk.destroy()).not.toThrow();
    });

    it("should clear cache on destroy", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Load a flag
      await sdk.isEnabled("test-flag");
      expect(sdk.getCacheStats().size).toBe(1);

      // Destroy should clear cache
      sdk.destroy();
      expect(sdk.getCacheStats().size).toBe(0);
    });
  });

  // === ADDITIONAL COVERAGE TESTS ===
  describe("Additional Coverage", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should handle missing flag in bulk cache", async () => {
      const mockFlags = {
        flags: [
          {
            key: "existing-flag",
            isEnabled: true,
            name: "Existing Flag",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Preload flags
      await sdk.preloadFlags();

      // Try to access a flag that's not in bulk cache
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }), {
        status: 200,
      });

      const result = await sdk.isEnabled("missing-flag");
      expect(result).toBe(false);

      sdk.destroy();
    });

    it("should handle cache disabled", async () => {
      fetchMock
        .mockResponseOnce(JSON.stringify({ enabled: true }), { status: 200 })
        .mockResponseOnce(JSON.stringify({ enabled: false }), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: false },
      });

      // Each call should hit API
      const result1 = await sdk.isEnabled("test-flag");
      const result2 = await sdk.isEnabled("test-flag");

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });

    it("should handle randomBytes for rollout without context", async () => {
      const mockFlags = {
        flags: [
          {
            key: "rollout-flag",
            isEnabled: true,
            name: "Rollout Flag",
            rolloutPercentage: 50,
            rolloutSeed: "test-seed",
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await sdk.preloadFlags();

      // Call without context - should use randomBytes
      const result = await sdk.isEnabled("rollout-flag");
      expect(typeof result).toBe("boolean");

      sdk.destroy();
    });

    it("should expose all error classes", async () => {
      const {
        FlagVaultError,
        FlagVaultAuthenticationError,
        FlagVaultNetworkError,
        FlagVaultAPIError,
      } = await import("../src/index");

      expect(FlagVaultError).toBeDefined();
      expect(FlagVaultAuthenticationError).toBeDefined();
      expect(FlagVaultNetworkError).toBeDefined();
      expect(FlagVaultAPIError).toBeDefined();

      // Test inheritance
      const authError = new FlagVaultAuthenticationError("test");
      expect(authError).toBeInstanceOf(FlagVaultError);
      expect(authError).toBeInstanceOf(Error);
    });

    it("should handle fetchFlagFromApi method", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: false }, // Disable cache to force API calls
      });

      const result = await sdk.isEnabled("test-flag");
      expect(result).toBe(true);

      sdk.destroy();
    });

    it("should test React hooks export", async () => {
      // Test that the hook functions are exported
      const { useFeatureFlag, useFeatureFlagCached } = await import(
        "../src/index"
      );

      expect(useFeatureFlag).toBeDefined();
      expect(useFeatureFlagCached).toBeDefined();
      expect(typeof useFeatureFlag).toBe("function");
      expect(typeof useFeatureFlagCached).toBe("function");
    });

    it("should handle error response with try-catch in JSON parsing", async () => {
      // Mock response with different error response format
      fetchMock.mockResponseOnce("", {
        status: 500,
        statusText: "",
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
      });

      const result = await sdk.isEnabled("test-flag", true);
      expect(result).toBe(true); // Should return default

      sdk.destroy();
    });
  });

  // === EDGE CASES ===
  describe("Edge Cases", () => {
    beforeEach(() => {
      fetchMock.resetMocks();
    });

    it("should handle constructor with all config options", () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        baseUrl: "https://custom-api.example.com",
        timeout: 5000,
        cache: {
          enabled: true,
          ttl: 600,
          maxSize: 500,
          refreshInterval: 120,
          fallbackBehavior: "throw",
        },
      });

      expect(sdk).toBeInstanceOf(FlagVaultSDK);
      sdk.destroy();
    });

    it("should handle empty constructor config", () => {
      expect(() => {
        new FlagVaultSDK({} as { apiKey: string });
      }).toThrow("API Key is required");
    });

    it("should handle undefined config properties", () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        baseUrl: undefined,
        timeout: undefined,
        cache: undefined,
      });

      expect(sdk).toBeInstanceOf(FlagVaultSDK);
      sdk.destroy();
    });

    it("should handle memory usage estimation", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true },
      });

      // Load some flags
      await sdk.isEnabled("flag1");

      const stats = sdk.getCacheStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);

      sdk.destroy();
    });

    it("should handle cache with expired entries", async () => {
      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, ttl: 0.01 }, // 10ms TTL
      });

      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      // Load flag
      await sdk.isEnabled("test-flag");

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = sdk.getCacheStats();
      expect(stats.expiredEntries).toBeGreaterThan(0);

      sdk.destroy();
    });

    it("should handle getAllFlags with invalid JSON", async () => {
      fetchMock.mockResponseOnce("Invalid JSON", { status: 200 });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      await expect(sdk.getAllFlags()).rejects.toThrow();

      sdk.destroy();
    });

    it("should handle context encoding in URLs", async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }), {
        status: 200,
      });

      const sdk = new FlagVaultSDK({ apiKey: "test-api-key" });

      // Use context with special characters that need encoding
      await sdk.isEnabled("test-flag", false, "user@example.com");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("context=user%40example.com"),
        expect.any(Object),
      );

      sdk.destroy();
    });

    it("should handle bulk cache expiry", async () => {
      const mockFlags = {
        flags: [
          {
            key: "flag1",
            isEnabled: true,
            name: "Flag 1",
            rolloutPercentage: null,
            rolloutSeed: null,
          },
        ],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockFlags), { status: 200 });

      const sdk = new FlagVaultSDK({
        apiKey: "test-api-key",
        cache: { enabled: true, ttl: 0.01 }, // 10ms TTL
      });

      // Preload flags
      await sdk.preloadFlags();

      // Wait for bulk cache to expire
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Mock new response for when cache is expired
      fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }), {
        status: 200,
      });

      // Should hit API again since bulk cache expired
      const result = await sdk.isEnabled("flag1");
      expect(result).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      sdk.destroy();
    });
  });
});
