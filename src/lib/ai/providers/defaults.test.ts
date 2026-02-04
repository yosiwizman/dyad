import { describe, it, expect } from "vitest";
import { mergeProviderSettings } from "./defaults";

describe("AI provider defaults", () => {
  it("mergeProviderSettings should always include builtin keys (including openai)", () => {
    const merged = mergeProviderSettings(undefined);

    expect(merged).toHaveProperty("openai");
    expect(merged).toHaveProperty("openrouter");
    expect(merged).toHaveProperty("google");
    expect(merged).toHaveProperty("anthropic");
  });

  it("mergeProviderSettings should preserve custom providers", () => {
    const merged = mergeProviderSettings({
      "custom::my-provider": { apiKey: { value: "abc" } },
    } as any);

    expect(merged).toHaveProperty("custom::my-provider");
    expect(merged["custom::my-provider"]).toEqual({ apiKey: { value: "abc" } });
    expect(merged).toHaveProperty("openai");
  });

  it("mergeProviderSettings should not throw on non-object input", () => {
    const merged = mergeProviderSettings("oops" as any);
    expect(merged).toHaveProperty("openai");
  });
});
