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
});
