import { describe, it, expect } from "vitest";
import {
  PublishStatusEnum,
  PublishStartRequestSchema,
  PublishStartResponseSchema,
  PublishStatusResponseSchema,
  PublishCancelResponseSchema,
} from "../lib/broker/types";

describe("broker schemas", () => {
  describe("PublishStatusEnum", () => {
    it("should accept valid statuses", () => {
      expect(PublishStatusEnum.parse("queued")).toBe("queued");
      expect(PublishStatusEnum.parse("packaging")).toBe("packaging");
      expect(PublishStatusEnum.parse("uploading")).toBe("uploading");
      expect(PublishStatusEnum.parse("building")).toBe("building");
      expect(PublishStatusEnum.parse("deploying")).toBe("deploying");
      expect(PublishStatusEnum.parse("ready")).toBe("ready");
      expect(PublishStatusEnum.parse("failed")).toBe("failed");
      expect(PublishStatusEnum.parse("cancelled")).toBe("cancelled");
    });

    it("should reject invalid statuses", () => {
      expect(() => PublishStatusEnum.parse("invalid")).toThrow();
      expect(() => PublishStatusEnum.parse("pending")).toThrow();
      expect(() => PublishStatusEnum.parse("")).toThrow();
    });
  });

  describe("PublishStartRequestSchema", () => {
    it("should accept valid requests", () => {
      const validRequest = {
        appId: 123,
        bundleHash: "abc123def456",
        bundleSize: 1024000,
      };
      const result = PublishStartRequestSchema.parse(validRequest);
      expect(result.appId).toBe(123);
      expect(result.bundleHash).toBe("abc123def456");
      expect(result.bundleSize).toBe(1024000);
    });

    it("should accept optional fields", () => {
      const requestWithOptional = {
        appId: 123,
        bundleHash: "abc123",
        bundleSize: 1024,
        profileId: "profile-uuid",
        appName: "My App",
      };
      const result = PublishStartRequestSchema.parse(requestWithOptional);
      expect(result.profileId).toBe("profile-uuid");
      expect(result.appName).toBe("My App");
    });

    it("should reject missing required fields", () => {
      expect(() =>
        PublishStartRequestSchema.parse({
          bundleHash: "abc",
          bundleSize: 100,
        }),
      ).toThrow();

      expect(() =>
        PublishStartRequestSchema.parse({
          appId: 1,
          bundleSize: 100,
        }),
      ).toThrow();
    });

    it("should reject invalid types", () => {
      expect(() =>
        PublishStartRequestSchema.parse({
          appId: "not-a-number",
          bundleHash: "abc",
          bundleSize: 100,
        }),
      ).toThrow();
    });
  });

  describe("PublishStartResponseSchema", () => {
    it("should accept valid responses", () => {
      const validResponse = {
        publishId: "pub-12345",
        status: "queued",
      };
      const result = PublishStartResponseSchema.parse(validResponse);
      expect(result.publishId).toBe("pub-12345");
      expect(result.status).toBe("queued");
    });

    it("should accept optional uploadUrl", () => {
      const responseWithUrl = {
        publishId: "pub-12345",
        status: "queued",
        uploadUrl: "https://upload.example.com/abc",
      };
      const result = PublishStartResponseSchema.parse(responseWithUrl);
      expect(result.uploadUrl).toBe("https://upload.example.com/abc");
    });
  });

  describe("PublishStatusResponseSchema", () => {
    it("should accept minimal response", () => {
      const minimalResponse = {
        status: "building",
      };
      const result = PublishStatusResponseSchema.parse(minimalResponse);
      expect(result.status).toBe("building");
    });

    it("should accept ready response with URL", () => {
      const readyResponse = {
        status: "ready",
        url: "https://abba.app/p/my-app",
        progress: 100,
        message: "Your app is live!",
      };
      const result = PublishStatusResponseSchema.parse(readyResponse);
      expect(result.status).toBe("ready");
      expect(result.url).toBe("https://abba.app/p/my-app");
      expect(result.progress).toBe(100);
    });

    it("should accept failed response with error", () => {
      const failedResponse = {
        status: "failed",
        error: "Build failed: missing dependencies",
        progress: 45,
      };
      const result = PublishStatusResponseSchema.parse(failedResponse);
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Build failed: missing dependencies");
    });
  });

  describe("PublishCancelResponseSchema", () => {
    it("should accept successful cancel", () => {
      const successResponse = {
        success: true,
        status: "cancelled",
      };
      const result = PublishCancelResponseSchema.parse(successResponse);
      expect(result.success).toBe(true);
      expect(result.status).toBe("cancelled");
    });

    it("should accept failed cancel (already complete)", () => {
      const failedResponse = {
        success: false,
        status: "ready",
      };
      const result = PublishCancelResponseSchema.parse(failedResponse);
      expect(result.success).toBe(false);
      expect(result.status).toBe("ready");
    });
  });
});

describe("publish state machine", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    queued: ["packaging", "failed", "cancelled"],
    packaging: ["uploading", "failed", "cancelled"],
    uploading: ["building", "failed", "cancelled"],
    building: ["deploying", "failed", "cancelled"],
    deploying: ["ready", "failed", "cancelled"],
    ready: [],
    failed: [],
    cancelled: [],
  };

  it("should have defined transitions for all statuses", () => {
    const allStatuses = [
      "queued",
      "packaging",
      "uploading",
      "building",
      "deploying",
      "ready",
      "failed",
      "cancelled",
    ];
    for (const status of allStatuses) {
      expect(VALID_TRANSITIONS).toHaveProperty(status);
    }
  });

  it("should have terminal states with no outgoing transitions", () => {
    expect(VALID_TRANSITIONS.ready).toHaveLength(0);
    expect(VALID_TRANSITIONS.failed).toHaveLength(0);
    expect(VALID_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("should allow cancellation from all non-terminal states", () => {
    const nonTerminalStates = [
      "queued",
      "packaging",
      "uploading",
      "building",
      "deploying",
    ];
    for (const state of nonTerminalStates) {
      expect(VALID_TRANSITIONS[state]).toContain("cancelled");
    }
  });

  it("should allow failure from all non-terminal states", () => {
    const nonTerminalStates = [
      "queued",
      "packaging",
      "uploading",
      "building",
      "deploying",
    ];
    for (const state of nonTerminalStates) {
      expect(VALID_TRANSITIONS[state]).toContain("failed");
    }
  });
});
