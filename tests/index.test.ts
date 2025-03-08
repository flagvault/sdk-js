import FlagVaultSDK from "../src/index";
import fetchMock from "jest-fetch-mock";

const baseUrl = "https://api.flagvault.com";

describe("FlagVaultSDK", () => {
  beforeEach(() => {
    fetchMock.resetMocks(); // Reset mocks before each test
  });

  it("should throw an error when the fetch request fails", async () => {
    // Mock a failed fetch request
    fetchMock.mockRejectOnce(new Error("Network error"));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    // Expect the original error to propagate
    await expect(sdk.isEnabled("test-flag-id")).rejects.toThrowError(
      "Network error",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/feature-flag/test-flag-id/enabled`,
      {
        method: "GET",
        headers: {
          "X-API-Key": "test-api-key",
          "X-API-Secret": "test-api-secret",
        },
      },
    );
  });

  it("should initialize correctly with valid config", () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    expect(sdk).toBeDefined();
  });

  it("should throw an error if initialized without API key or secret", () => {
    expect(() => new FlagVaultSDK({ apiKey: "", apiSecret: "" })).toThrowError(
      "API Key and Secret are required to initialize the SDK.",
    );
  });

  it("should return true if the feature flag is enabled", async () => {
    // Mock the fetch response for a successful API call
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: true }));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    const isEnabled = await sdk.isEnabled("test-flag-id");

    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/feature-flag/test-flag-id/enabled`,
      {
        method: "GET",
        headers: {
          "X-API-Key": "test-api-key",
          "X-API-Secret": "test-api-secret",
        },
      },
    );
    expect(isEnabled).toBe(true);
  });

  it("should return false if the feature flag is disabled", async () => {
    // Mock the fetch response for a disabled feature flag
    fetchMock.mockResponseOnce(JSON.stringify({ enabled: false }));

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    const isEnabled = await sdk.isEnabled("test-flag-id");

    expect(isEnabled).toBe(false);
  });

  it("should throw an error if flagId is missing", async () => {
    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    await expect(sdk.isEnabled("")).rejects.toThrowError(
      "flagId is required to check if a feature is enabled.",
    );
  });

  it("should throw an error when the API response is not OK", async () => {
    // Mock a response with a failing status code (500 Internal Server Error)
    fetchMock.mockResponseOnce("", {
      status: 500,
      statusText: "Internal Server Error",
    });

    const sdk = new FlagVaultSDK({
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
    });

    // Expect the method to throw the appropriate error
    await expect(sdk.isEnabled("test-flag-id")).rejects.toThrowError(
      "HTTP error! Status: 500",
    );

    // Ensure the correct request was made
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/feature-flag/test-flag-id/enabled`,
      {
        method: "GET",
        headers: {
          "X-API-Key": "test-api-key",
          "X-API-Secret": "test-api-secret",
        },
      },
    );
  });
});