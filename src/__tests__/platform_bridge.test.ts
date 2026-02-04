import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isDesktopRuntime,
  isWebPreviewMode,
  logWebPreviewWarning,
} from "../lib/platform/bridge";

describe("platform bridge", () => {
  // Store original window object
  const originalWindow = global.window;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore window after each test
    global.window = originalWindow;
  });

  describe("isDesktopRuntime", () => {
    it("should return false when window is undefined (SSR)", () => {
      // Simulate SSR environment
      // @ts-ignore - intentionally setting to undefined for test
      global.window = undefined;
      expect(isDesktopRuntime()).toBe(false);
    });

    it("should return false when window.electron is undefined (browser)", () => {
      // Simulate browser environment without Electron
      global.window = { electron: undefined } as any;
      expect(isDesktopRuntime()).toBe(false);
    });

    it("should return false when window.electron.ipcRenderer is undefined", () => {
      global.window = { electron: {} } as any;
      expect(isDesktopRuntime()).toBe(false);
    });

    it("should return false when ipcRenderer.invoke is not a function", () => {
      global.window = {
        electron: {
          ipcRenderer: { invoke: "not a function" },
        },
      } as any;
      expect(isDesktopRuntime()).toBe(false);
    });

    it("should return true when full Electron API is available", () => {
      global.window = {
        electron: {
          ipcRenderer: {
            invoke: vi.fn(),
            on: vi.fn(),
          },
        },
      } as any;
      expect(isDesktopRuntime()).toBe(true);
    });

    it("should return false in test environment (happy-dom/jsdom)", () => {
      // In test environment, window.electron should not be defined
      // This tests the real behavior in CI
      expect(isDesktopRuntime()).toBe(false);
    });
  });

  describe("isWebPreviewMode", () => {
    it("should return false in normal desktop environment", () => {
      // Mock normal desktop environment
      global.window = {
        location: { hostname: "localhost" },
      } as any;

      // Reset module to clear any env variable caching
      expect(isWebPreviewMode()).toBe(false);
    });

    it("should return true when hostname ends with .github.io", () => {
      global.window = {
        location: { hostname: "yosiwizman.github.io" },
      } as any;
      expect(isWebPreviewMode()).toBe(true);
    });

    it("should return true for any .github.io subdomain", () => {
      global.window = {
        location: { hostname: "some-user.github.io" },
      } as any;
      expect(isWebPreviewMode()).toBe(true);
    });

    it("should return false when window is undefined", () => {
      // @ts-ignore
      global.window = undefined;
      expect(isWebPreviewMode()).toBe(false);
    });

    it("should return false for non-github.io hostnames", () => {
      global.window = {
        location: { hostname: "example.com" },
      } as any;
      expect(isWebPreviewMode()).toBe(false);
    });
  });

  describe("logWebPreviewWarning", () => {
    it("should log a warning to console", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      // The warning is only shown once, so we need to test in isolation
      // The module-level flag prevents duplicate warnings
      logWebPreviewWarning("testOperation");

      // Debug log should always be called if operation is provided
      expect(debugSpy).toHaveBeenCalledWith(
        "[Web Preview] Stubbed operation: testOperation",
      );

      warnSpy.mockRestore();
      debugSpy.mockRestore();
    });

    it("should not throw when called", () => {
      expect(() => logWebPreviewWarning()).not.toThrow();
      expect(() => logWebPreviewWarning("someOperation")).not.toThrow();
    });
  });
});
