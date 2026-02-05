import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDefaultUserSettings } from "@/lib/settings/defaults";

describe("Web Preview LLM Proxy", () => {
  describe("Default Settings", () => {
    it("should include llmProxyUrl in default settings", () => {
      const defaults = createDefaultUserSettings();
      expect(defaults.llmProxyUrl).toBeDefined();
      expect(defaults.llmProxyUrl).toBe(
        "https://dyad-llm-proxy.x-builder-staging.workers.dev",
      );
    });

    it("should allow overriding llmProxyUrl", () => {
      const overrides = { llmProxyUrl: "https://custom-broker.example.com" };
      const settings = createDefaultUserSettings(overrides);
      expect(settings.llmProxyUrl).toBe("https://custom-broker.example.com");
    });
  });

  describe("WebIpcClient streamMessage (broker proxy)", () => {
    let mockOnUpdate: ReturnType<typeof vi.fn>;
    let mockOnEnd: ReturnType<typeof vi.fn>;
    let mockOnError: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockOnUpdate = vi.fn();
      mockOnEnd = vi.fn();
      mockOnError = vi.fn();

      // Clear localStorage
      localStorage.clear();

      // Reset fetch mock
      vi.restoreAllMocks();
    });

    it("should call onError when broker URL is not configured", async () => {
      // Import WebIpcClient dynamically to avoid side effects
      const { WebIpcClient } = await import("@/ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      // Set settings without brokerUrl
      localStorage.setItem(
        "abba_demo_settings",
        JSON.stringify({ llmProxyUrl: "" }),
      );

      client.streamMessage("test prompt", {
        chatId: 1,
        onUpdate: mockOnUpdate,
        onEnd: mockOnEnd,
        onError: mockOnError,
      });

      // Wait a tick for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining("LLM is not connected in web preview mode"),
      );
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockOnEnd).not.toHaveBeenCalled();
    });

    it("should make POST request to broker with correct payload", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: "Hello from LLM!",
              },
            },
          ],
          model: "openai/gpt-3.5-turbo",
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { WebIpcClient } = await import("@/ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      // Set settings with brokerUrl
      localStorage.setItem(
        "abba_demo_settings",
        JSON.stringify({
          llmProxyUrl: "https://test-broker.example.com",
        }),
      );

      client.streamMessage("Hello!", {
        chatId: 1,
        onUpdate: mockOnUpdate,
        onEnd: mockOnEnd,
        onError: mockOnError,
      });

      // Wait for async fetch to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test-broker.example.com/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("Hello!"),
        }),
      );

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: "assistant",
            content: "Hello from LLM!",
          }),
        ]),
      );

      expect(mockOnEnd).toHaveBeenCalledWith({
        chatId: 1,
        updatedFiles: false,
      });

      vi.unstubAllGlobals();
    });

    it("should handle broker errors gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () =>
          JSON.stringify({
            ok: false,
            reason: "FORBIDDEN",
            message: "Origin not allowed",
            requestId: "test-request-id-123",
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const { WebIpcClient } = await import("@/ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      localStorage.setItem(
        "abba_demo_settings",
        JSON.stringify({
          llmProxyUrl: "https://test-broker.example.com",
        }),
      );

      client.streamMessage("Test", {
        chatId: 1,
        onUpdate: mockOnUpdate,
        onEnd: mockOnEnd,
        onError: mockOnError,
      });

      // Wait for async fetch to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockOnError).toHaveBeenCalledWith("Origin not allowed");
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockOnEnd).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });

    it("should handle network errors gracefully", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Network error: Failed to fetch"));
      vi.stubGlobal("fetch", mockFetch);

      const { WebIpcClient } = await import("@/ipc/web_ipc_client");
      const client = WebIpcClient.getInstance();

      localStorage.setItem(
        "abba_demo_settings",
        JSON.stringify({
          llmProxyUrl: "https://test-broker.example.com",
        }),
      );

      client.streamMessage("Test", {
        chatId: 1,
        onUpdate: mockOnUpdate,
        onEnd: mockOnEnd,
        onError: mockOnError,
      });

      // Wait for async fetch to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockOnError).toHaveBeenCalledWith(
        "Network error: Failed to fetch",
      );
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockOnEnd).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
