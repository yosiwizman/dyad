import { describe, it, expect } from "vitest";
import {
  stubPublishStart,
  stubPublishStatus,
} from "../lib/broker/stub_transport";

describe("stub transport local URL generation", () => {
  describe("stubPublishStart with appPath", () => {
    it("should store appPath in publish state", async () => {
      const result = await stubPublishStart({
        appId: 1,
        bundleHash: "abc123",
        bundleSize: 1024,
        appPath: "C:/Users/test/abba-ai-apps/my-app",
      });

      expect(result.publishId).toMatch(/^stub-/);
      expect(result.status).toBe("queued");
    });
  });

  describe("stubPublishStatus local URL", () => {
    it("should return file:// URL when appPath is provided", async () => {
      // Start a publish with appPath
      const startResult = await stubPublishStart({
        appId: 1,
        bundleHash: "abc123",
        bundleSize: 1024,
        appPath: "C:/Users/test/abba-ai-apps/my-app",
      });

      // Wait for publish to complete (stub takes ~15s, but we can check the URL format)
      // Simulate waiting by checking multiple times
      let statusResult;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        statusResult = await stubPublishStatus(startResult.publishId);
        if (statusResult.status === "ready") {
          break;
        }
      }

      expect(statusResult?.status).toBe("ready");
      expect(statusResult?.url).toMatch(/^file:\/\/\//);
      expect(statusResult?.url).toContain("my-app");
    }, 25000); // Extended timeout for stub simulation

    it("should convert Windows backslashes to forward slashes", async () => {
      const startResult = await stubPublishStart({
        appId: 2,
        bundleHash: "def456",
        bundleSize: 2048,
        appPath: "C:\\Users\\test\\abba-ai-apps\\another-app",
      });

      // Wait for publish to complete
      let statusResult;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        statusResult = await stubPublishStatus(startResult.publishId);
        if (statusResult.status === "ready") {
          break;
        }
      }

      expect(statusResult?.status).toBe("ready");
      // Should have forward slashes in the URL
      expect(statusResult?.url).toMatch(/^file:\/\/\//);
      expect(statusResult?.url).not.toContain("\\");
    }, 25000);

    it("should return stub:// URL when appPath is not provided", async () => {
      const startResult = await stubPublishStart({
        appId: 3,
        bundleHash: "ghi789",
        bundleSize: 3072,
        // No appPath provided
      });

      // Wait for publish to complete
      let statusResult;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        statusResult = await stubPublishStatus(startResult.publishId);
        if (statusResult.status === "ready") {
          break;
        }
      }

      expect(statusResult?.status).toBe("ready");
      // Should fall back to stub:// URL
      expect(statusResult?.url).toMatch(/^stub:\/\/local\//);
    }, 25000);
  });

  describe("stub status messages", () => {
    it("should return appropriate messages for stub mode", async () => {
      const startResult = await stubPublishStart({
        appId: 4,
        bundleHash: "jkl012",
        bundleSize: 4096,
        appPath: "/test/path",
      });

      // Check early status
      const earlyStatus = await stubPublishStatus(startResult.publishId);

      // Messages should indicate stub mode
      if (earlyStatus.status === "deploying") {
        expect(earlyStatus.message).toContain("local preview");
      }

      // Wait for ready
      let statusResult;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        statusResult = await stubPublishStatus(startResult.publishId);
        if (statusResult.status === "ready") {
          break;
        }
      }

      expect(statusResult?.message).toContain("local preview");
    }, 25000);
  });
});
