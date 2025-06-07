import FlagVaultSDK, {
  FlagVaultAuthenticationError,
  FlagVaultNetworkError,
  FlagVaultAPIError,
} from "../src/index";
import fetchMock from "jest-fetch-mock";

const baseUrl = "https://api.flagvault.com/api";

describe("FlagVaultSDK", () => {
  beforeEach(() => {
    fetchMock.resetMocks(); // Reset mocks before each test
  });

  it("should throw FlagVaultNetworkError when the fetch request fails", async () => {
    // Mock a failed fetch request (twice for two expect calls)
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));
    fetchMock.mockRejectOnce(new TypeError("Failed to fetch"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultNetworkError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Failed to connect to FlagVault API",
    );
  });

  it("should initialize correctly with valid config", () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    expect(sdk).toBeDefined();
  });

  it("should initialize correctly with custom config", () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      baseUrl: "https://custom.api.com",
      timeout: 5000,
    });

    expect(sdk).toBeDefined();
  });

  it("should throw an error if initialized without API key or secret", () => {
    expect(() => new FlagVaultSDK({ apiKey: "" })).toThrowError(
      "API Key is required to initialize the SDK.",
    );
  });

  it("should return true if the feature flag is enabled", async () => {
    // Mock the fetch response for a successful API call
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const isEnabled = await sdk.isEnabled("test-flag-key");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/feature-flag/test-flag-key/enabled`,
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "test-api-key",
        },
      }),
    );
    expect(isEnabled).toBe(true);
  });

  it("should return false if the feature flag is disabled", async () => {
    // Mock the fetch response for a disabled feature flag
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }));

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

  it("should throw FlagVaultAuthenticationError for 401 responses", async () => {
    // Mock twice for two expect calls
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAuthenticationError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Invalid API credentials",
    );
  });

  it("should throw FlagVaultAuthenticationError for 403 responses", async () => {
    // Mock twice for two expect calls
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAuthenticationError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Access forbidden - check your API credentials",
    );
  });

  it("should throw FlagVaultAPIError for other HTTP errors", async () => {
    // Mock twice for two expect calls
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 },
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ message: "Internal Server Error" }),
      { status: 500 },
    );

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAPIError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "API request failed: Internal Server Error",
    );
  });

  it("should throw FlagVaultAPIError when HTTP error response has invalid JSON", async () => {
    // Mock twice for two expect calls
    fetchMock.mockResponseOnce("<html>Internal Server Error</html>", {
      status: 500,
      statusText: "Internal Server Error",
    });
    fetchMock.mockResponseOnce("<html>Internal Server Error</html>", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAPIError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "API request failed: HTTP 500: Internal Server Error",
    );
  });

  it("should throw FlagVaultNetworkError when request times out", async () => {
    // Mock AbortError for timeout (twice for two expect calls)
    fetchMock.mockAbortOnce();
    fetchMock.mockAbortOnce();

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      timeout: 1000,
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultNetworkError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Request timed out after 1000ms",
    );
  });

  it("should throw FlagVaultAPIError when response is not valid JSON", async () => {
    fetchMock.mockResponseOnce("invalid json");

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAPIError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Invalid JSON response",
    );
  });

  it("should return false when enabled field is missing from response", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ other_field: "value" }));

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

    await expect(sdk.isEnabled(null as unknown as string)).rejects.toThrow(
      "flagKey is required to check if a feature is enabled.",
    );
    await expect(sdk.isEnabled(undefined as unknown as string)).rejects.toThrow(
      "flagKey is required to check if a feature is enabled.",
    );
  });

  it("should handle flag keys with special characters", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    const flagKey = "test-flag_key.with$pecial@chars";
    const isEnabled = await sdk.isEnabled(flagKey);

    expect(isEnabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/feature-flag/${flagKey}/enabled`,
      expect.objectContaining({
        method: "GET",
        headers: {
          "X-API-Key": "test-api-key",
        },
      }),
    );
  });

  it("should throw FlagVaultNetworkError for generic RequestException", async () => {
    // Mock generic error (not TypeError or AbortError)
    fetchMock.mockRejectOnce(new Error("Generic network error"));
    fetchMock.mockRejectOnce(new Error("Generic network error"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultNetworkError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "Network error: Error: Generic network error",
    );
  });

  it("should throw FlagVaultAPIError with HTTP status when error JSON has no message", async () => {
    // Mock error response with JSON that has no message field
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: "Something went wrong", code: 500 }),
      { status: 500 },
    );
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: "Something went wrong", code: 500 }),
      { status: 500 },
    );

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
    });

    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      FlagVaultAPIError,
    );
    await expect(sdk.isEnabled("test-flag-key")).rejects.toThrow(
      "API request failed: HTTP 500",
    );
  });
});
