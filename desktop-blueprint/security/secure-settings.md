# Secure Settings Blueprint

For production, API keys should not be stored in `localStorage`.

Recommended storage:

- macOS: Keychain
- Windows: Credential Manager
- Linux: Secret Service

Use a package such as `keytar` behind a local abstraction:

```ts
export interface SecureSettings {
  getApiKey(provider: "anthropic" | "openai"): Promise<string | null>;
  setApiKey(provider: "anthropic" | "openai", value: string): Promise<void>;
  deleteApiKey(provider: "anthropic" | "openai"): Promise<void>;
}
```

SQLite should store only metadata, such as provider name, masked key preview, last validation time and connection status.
