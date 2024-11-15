interface FlagorySDKConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}

class FlagorySDK {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor(config: FlagorySDKConfig) {
    const { apiKey, apiSecret, baseUrl = "https://api.flagory.com" } = config;

    if (!apiKey || !apiSecret) {
      throw new Error("API Key and Secret are required to initialize the SDK.");
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
  }

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

export default FlagorySDK;
