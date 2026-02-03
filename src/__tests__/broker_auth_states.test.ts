import { describe, it, expect } from "vitest";
import { BrokerApiError } from "../lib/broker/client";

describe("BrokerApiError", () => {
  describe("isAuthError", () => {
    it("should return true for 401 status", () => {
      const error = new BrokerApiError(
        "Unauthorized",
        401,
        "Unauthorized",
        "Invalid token",
      );
      expect(error.isAuthError()).toBe(true);
    });

    it("should return false for other status codes", () => {
      const error403 = new BrokerApiError("Forbidden", 403, "Forbidden");
      const error500 = new BrokerApiError(
        "Server Error",
        500,
        "Internal Server Error",
      );
      const error503 = new BrokerApiError(
        "Unavailable",
        503,
        "Service Unavailable",
      );

      expect(error403.isAuthError()).toBe(false);
      expect(error500.isAuthError()).toBe(false);
      expect(error503.isAuthError()).toBe(false);
    });
  });

  describe("isBrokerMisconfigured", () => {
    it("should return true for 503 with BrokerMisconfigured errorCode", () => {
      const error = new BrokerApiError(
        "Broker server misconfigured",
        503,
        "Service Unavailable",
        '{"error":"BrokerMisconfigured"}',
        "BrokerMisconfigured",
      );
      expect(error.isBrokerMisconfigured()).toBe(true);
    });

    it("should return false for 503 without BrokerMisconfigured errorCode", () => {
      const error = new BrokerApiError(
        "Service temporarily unavailable",
        503,
        "Service Unavailable",
      );
      expect(error.isBrokerMisconfigured()).toBe(false);
    });

    it("should return false for other status codes with BrokerMisconfigured errorCode", () => {
      const error = new BrokerApiError(
        "Something else",
        500,
        "Internal Server Error",
        undefined,
        "BrokerMisconfigured",
      );
      expect(error.isBrokerMisconfigured()).toBe(false);
    });
  });

  describe("getDiagnostics", () => {
    it("should return diagnostics-safe info without secrets", () => {
      const error = new BrokerApiError(
        "Auth failed: token invalid",
        401,
        "Unauthorized",
        '{"error":"InvalidToken","details":"secret-data"}',
      );

      const diagnostics = error.getDiagnostics();

      expect(diagnostics).toEqual({
        statusCode: 401,
        statusText: "Unauthorized",
        message: "Auth failed: token invalid",
      });
      // Should NOT include responseBody (could contain secrets)
      expect(diagnostics).not.toHaveProperty("responseBody");
    });
  });
});

describe("Auth state mapping", () => {
  // Maps TestBrokerAuthResult reasons to UI states
  const mapReasonToUIState = (
    reason: string | undefined,
    success: boolean,
  ):
    | "connected"
    | "setup_required"
    | "misconfigured"
    | "mismatch"
    | "error" => {
    if (success) return "connected";
    switch (reason) {
      case "token_not_set":
        return "setup_required";
      case "broker_misconfigured":
        return "misconfigured";
      case "token_invalid":
      case "token_missing":
        return "mismatch";
      default:
        return "error";
    }
  };

  it("should map successful auth to connected", () => {
    expect(mapReasonToUIState(undefined, true)).toBe("connected");
  });

  it("should map token_not_set to setup_required", () => {
    expect(mapReasonToUIState("token_not_set", false)).toBe("setup_required");
  });

  it("should map broker_misconfigured to misconfigured", () => {
    expect(mapReasonToUIState("broker_misconfigured", false)).toBe(
      "misconfigured",
    );
  });

  it("should map token_invalid to mismatch", () => {
    expect(mapReasonToUIState("token_invalid", false)).toBe("mismatch");
  });

  it("should map token_missing to mismatch", () => {
    expect(mapReasonToUIState("token_missing", false)).toBe("mismatch");
  });

  it("should map server_error to error", () => {
    expect(mapReasonToUIState("server_error", false)).toBe("error");
  });

  it("should map connection_error to error", () => {
    expect(mapReasonToUIState("connection_error", false)).toBe("error");
  });

  it("should map unknown reasons to error", () => {
    expect(mapReasonToUIState("unknown_reason", false)).toBe("error");
    expect(mapReasonToUIState(undefined, false)).toBe("error");
  });
});

describe("Vault error classifier", () => {
  // Mirrors isAuthError from VaultBackupButton.tsx
  function isAuthError(error: Error): boolean {
    const message = error.message?.toLowerCase() || "";
    return (
      message.includes("401") ||
      message.includes("expired") ||
      (message.includes("invalid") && message.includes("token")) ||
      message.includes("unauthorized") ||
      message.includes("not authenticated") ||
      message.includes("session")
    );
  }

  // Mirrors isNetworkError from VaultBackupButton.tsx
  function isNetworkError(error: Error): boolean {
    const message = error.message?.toLowerCase() || "";
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("enotfound") ||
      message.includes("timeout") ||
      message.includes("cannot reach")
    );
  }

  describe("isAuthError", () => {
    it("should detect 401 errors", () => {
      expect(isAuthError(new Error("Request failed with status 401"))).toBe(
        true,
      );
      expect(isAuthError(new Error("401 Unauthorized"))).toBe(true);
    });

    it("should detect expired token errors", () => {
      expect(isAuthError(new Error("Token has expired"))).toBe(true);
      expect(
        isAuthError(new Error("Session expired, please sign in again")),
      ).toBe(true);
    });

    it("should detect invalid token errors", () => {
      expect(isAuthError(new Error("Invalid token provided"))).toBe(true);
      expect(isAuthError(new Error("Token is invalid or malformed"))).toBe(
        true,
      );
    });

    it("should detect unauthorized errors", () => {
      expect(isAuthError(new Error("Unauthorized access"))).toBe(true);
      expect(isAuthError(new Error("User is not authenticated"))).toBe(true);
    });

    it("should detect session errors", () => {
      expect(isAuthError(new Error("Session not found"))).toBe(true);
      expect(isAuthError(new Error("Invalid session"))).toBe(true);
    });

    it("should not classify other errors as auth errors", () => {
      expect(isAuthError(new Error("Network error"))).toBe(false);
      expect(isAuthError(new Error("File not found"))).toBe(false);
      expect(isAuthError(new Error("Invalid input"))).toBe(false);
      expect(isAuthError(new Error("Server error 500"))).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should detect network errors", () => {
      expect(isNetworkError(new Error("Network request failed"))).toBe(true);
      expect(
        isNetworkError(new Error("NetworkError when attempting to fetch")),
      ).toBe(true);
    });

    it("should detect fetch errors", () => {
      expect(isNetworkError(new Error("fetch failed"))).toBe(true);
      expect(isNetworkError(new Error("Failed to fetch resource"))).toBe(true);
    });

    it("should detect DNS errors", () => {
      expect(
        isNetworkError(new Error("getaddrinfo ENOTFOUND api.example.com")),
      ).toBe(true);
    });

    it("should detect timeout errors", () => {
      expect(isNetworkError(new Error("Request timeout after 30000ms"))).toBe(
        true,
      );
      expect(isNetworkError(new Error("Connection timeout"))).toBe(true);
    });

    it("should detect unreachable host errors", () => {
      expect(isNetworkError(new Error("Cannot reach server"))).toBe(true);
    });

    it("should not classify other errors as network errors", () => {
      expect(isNetworkError(new Error("401 Unauthorized"))).toBe(false);
      expect(isNetworkError(new Error("Invalid token"))).toBe(false);
      expect(isNetworkError(new Error("File not found"))).toBe(false);
    });
  });
});
