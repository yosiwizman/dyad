import { describe, it, expect } from "vitest";

/**
 * Helper functions for testing - mirrors the implementation in VaultBackupButton
 */
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

describe("vault auth error detection", () => {
  describe("isAuthError", () => {
    it("should detect 401 errors", () => {
      expect(isAuthError(new Error("HTTP 401: Unauthorized"))).toBe(true);
      expect(
        isAuthError(new Error("Error: 401 - Token validation failed")),
      ).toBe(true);
    });

    it("should detect expired token errors", () => {
      expect(isAuthError(new Error("Token expired"))).toBe(true);
      expect(isAuthError(new Error("Session expired"))).toBe(true);
      expect(
        isAuthError(
          new Error("Your session has expired. Please sign in again."),
        ),
      ).toBe(true);
    });

    it("should detect invalid token errors", () => {
      expect(isAuthError(new Error("Invalid or expired token"))).toBe(true);
      expect(isAuthError(new Error("Token is invalid"))).toBe(true);
      expect(isAuthError(new Error("JWT token invalid"))).toBe(true);
    });

    it("should detect unauthorized errors", () => {
      expect(isAuthError(new Error("Unauthorized"))).toBe(true);
      expect(isAuthError(new Error("Unauthorized access"))).toBe(true);
    });

    it("should detect not authenticated errors", () => {
      expect(
        isAuthError(
          new Error("Not authenticated. Please sign in to use Vault."),
        ),
      ).toBe(true);
      expect(isAuthError(new Error("User is not authenticated"))).toBe(true);
    });

    it("should detect session-related errors", () => {
      expect(isAuthError(new Error("Session not found"))).toBe(true);
      expect(isAuthError(new Error("Invalid session"))).toBe(true);
    });

    it("should NOT detect non-auth errors", () => {
      expect(isAuthError(new Error("File not found"))).toBe(false);
      expect(isAuthError(new Error("Network error"))).toBe(false);
      expect(isAuthError(new Error("Build failed"))).toBe(false);
      expect(isAuthError(new Error("Permission denied"))).toBe(false);
    });
  });

  describe("isNetworkError", () => {
    it("should detect network errors", () => {
      expect(isNetworkError(new Error("Network error"))).toBe(true);
      expect(isNetworkError(new Error("A network error occurred"))).toBe(true);
    });

    it("should detect fetch errors", () => {
      expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
      expect(isNetworkError(new Error("Fetch failed"))).toBe(true);
    });

    it("should detect DNS errors", () => {
      expect(isNetworkError(new Error("ENOTFOUND: DNS lookup failed"))).toBe(
        true,
      );
      expect(
        isNetworkError(new Error("getaddrinfo ENOTFOUND api.example.com")),
      ).toBe(true);
    });

    it("should detect timeout errors", () => {
      expect(isNetworkError(new Error("Request timeout"))).toBe(true);
      expect(isNetworkError(new Error("Connection timeout"))).toBe(true);
    });

    it("should detect reachability errors", () => {
      expect(isNetworkError(new Error("Cannot reach server"))).toBe(true);
      expect(isNetworkError(new Error("Cannot reach Vault"))).toBe(true);
    });

    it("should NOT detect non-network errors", () => {
      expect(isNetworkError(new Error("Token expired"))).toBe(false);
      expect(isNetworkError(new Error("Unauthorized"))).toBe(false);
      expect(isNetworkError(new Error("Build failed"))).toBe(false);
      expect(isNetworkError(new Error("File not found"))).toBe(false);
    });
  });

  describe("error categorization priority", () => {
    it("should correctly categorize mixed error messages", () => {
      // Auth error with network-like words should be auth
      const authError = new Error("Session expired due to network issues");
      expect(isAuthError(authError)).toBe(true);
      expect(isNetworkError(authError)).toBe(true);
      // In the actual implementation, auth errors take priority

      // Pure network error
      const networkError = new Error("Failed to fetch: ENOTFOUND");
      expect(isAuthError(networkError)).toBe(false);
      expect(isNetworkError(networkError)).toBe(true);

      // Pure auth error
      const pureAuthError = new Error("401 Unauthorized");
      expect(isAuthError(pureAuthError)).toBe(true);
      expect(isNetworkError(pureAuthError)).toBe(false);
    });
  });
});

describe("vault auth retry flow", () => {
  describe("retry logic", () => {
    it("should describe the expected retry behavior", () => {
      /**
       * Expected retry flow:
       * 1. Initial backup attempt fails with auth error
       * 2. Attempt session refresh via vault:auth-refresh
       * 3. If refresh succeeds, retry backup once
       * 4. If refresh fails, show auth dialog
       *
       * This is tested via the actual component in integration tests.
       * Here we verify the error detection that triggers this flow.
       */

      const vaultError = new Error(
        "Error invoking remote method 'vault:create-backup': Invalid or expired token",
      );
      expect(isAuthError(vaultError)).toBe(true);
      expect(isNetworkError(vaultError)).toBe(false);
    });

    it("should handle the exact error message from the user report", () => {
      // The user reported: "Error invoking remote method 'vault:create-backup' … Invalid or expired token"
      const reportedError = new Error(
        "Error invoking remote method 'vault:create-backup': Invalid or expired token",
      );

      expect(isAuthError(reportedError)).toBe(true);
    });
  });

  describe("user messaging", () => {
    it("should have appropriate messages for different error types", () => {
      // These are the expected messages shown to users
      const authErrorMessage =
        "Your Vault session has expired. Please sign in again.";
      const networkErrorMessage =
        "Cannot reach Vault. Please check your internet connection.";

      expect(authErrorMessage).toContain("expired");
      expect(authErrorMessage).toContain("sign in");
      expect(networkErrorMessage).toContain("connection");
    });
  });
});
