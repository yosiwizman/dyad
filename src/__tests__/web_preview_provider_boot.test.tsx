import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("posthog-js/react", () => {
  return {
    usePostHog: () => ({
      people: { set: () => {} },
      capture: () => {},
    }),
  };
});

describe("web preview provider boot", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();

    // Simulate an old/partial stored settings payload (missing providerSettings)
    window.localStorage.setItem("abba_demo_settings", JSON.stringify({}));

    // Ensure we look like a browser (no Electron globals)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron;
  });

  it("should not crash and should provide a canonical providerSettings shape", async () => {
    const { useSettings } = await import("@/hooks/useSettings");
    const { useLanguageModelProviders } = await import(
      "@/hooks/useLanguageModelProviders"
    );

    function Probe() {
      const { settings, loading, error } = useSettings();
      const { isAnyProviderSetup } = useLanguageModelProviders();

      if (loading) return <div data-testid="loading">loading</div>;
      if (error) return <div data-testid="error">{error.message}</div>;

      // Calling this used to crash with:
      // TypeError: Cannot read properties of undefined (reading 'openai')
      const any = isAnyProviderSetup();

      const hasOpenAI = Boolean(settings?.providerSettings?.openai);
      return (
        <div data-testid="boot">
          {String(any)}|{hasOpenAI ? "hasOpenAI" : "missingOpenAI"}
        </div>
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      screen.getByTestId("boot");
    });

    expect(screen.getByTestId("boot").textContent).toContain("hasOpenAI");
  });
});
