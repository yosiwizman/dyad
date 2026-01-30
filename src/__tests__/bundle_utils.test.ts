import { describe, it, expect } from "vitest";
import {
  shouldExclude,
  EXCLUDED_DIRECTORIES,
  EXCLUDED_FILE_PATTERNS,
} from "../ipc/utils/bundle_utils";

describe("bundle_utils", () => {
  describe("shouldExclude", () => {
    describe("directory exclusions", () => {
      it("should exclude node_modules", () => {
        expect(shouldExclude("node_modules", true)).toBe(true);
        expect(shouldExclude("src/node_modules", true)).toBe(true);
      });

      it("should exclude .git", () => {
        expect(shouldExclude(".git", true)).toBe(true);
        expect(shouldExclude("project/.git", true)).toBe(true);
      });

      it("should exclude dist/build/out directories", () => {
        expect(shouldExclude("dist", true)).toBe(true);
        expect(shouldExclude("build", true)).toBe(true);
        expect(shouldExclude("out", true)).toBe(true);
        expect(shouldExclude(".next", true)).toBe(true);
      });

      it("should exclude .vercel and .netlify", () => {
        expect(shouldExclude(".vercel", true)).toBe(true);
        expect(shouldExclude(".netlify", true)).toBe(true);
      });

      it("should exclude cache directories", () => {
        expect(shouldExclude(".cache", true)).toBe(true);
        expect(shouldExclude(".turbo", true)).toBe(true);
        expect(shouldExclude(".parcel-cache", true)).toBe(true);
      });

      it("should exclude IDE directories", () => {
        expect(shouldExclude(".idea", true)).toBe(true);
        expect(shouldExclude(".vscode", true)).toBe(true);
        expect(shouldExclude(".vs", true)).toBe(true);
      });

      it("should NOT exclude regular source directories", () => {
        expect(shouldExclude("src", true)).toBe(false);
        expect(shouldExclude("public", true)).toBe(false);
        expect(shouldExclude("components", true)).toBe(false);
        expect(shouldExclude("lib", true)).toBe(false);
      });
    });

    describe("file pattern exclusions", () => {
      it("should exclude .env files", () => {
        expect(shouldExclude(".env", false)).toBe(true);
        expect(shouldExclude(".env.local", false)).toBe(true);
        expect(shouldExclude(".env.production", false)).toBe(true);
        expect(shouldExclude(".env.development", false)).toBe(true);
      });

      it("should exclude secret files", () => {
        expect(shouldExclude(".secret", false)).toBe(true);
        expect(shouldExclude("credentials.key", false)).toBe(true);
        expect(shouldExclude("private.pem", false)).toBe(true);
      });

      it("should exclude OS junk files", () => {
        expect(shouldExclude(".DS_Store", false)).toBe(true);
        expect(shouldExclude("Thumbs.db", false)).toBe(true);
        expect(shouldExclude("desktop.ini", false)).toBe(true);
      });

      it("should exclude editor temp files", () => {
        expect(shouldExclude("file.swp", false)).toBe(true);
        expect(shouldExclude("file.swo", false)).toBe(true);
        expect(shouldExclude("file~", false)).toBe(true);
      });

      it("should exclude lock files", () => {
        expect(shouldExclude("package-lock.json", false)).toBe(true);
        expect(shouldExclude("pnpm-lock.yaml", false)).toBe(true);
        expect(shouldExclude("yarn.lock", false)).toBe(true);
        expect(shouldExclude("bun.lockb", false)).toBe(true);
      });

      it("should exclude log files", () => {
        expect(shouldExclude("debug.log", false)).toBe(true);
        expect(shouldExclude("npm-debug.log", false)).toBe(true);
        expect(shouldExclude("yarn-error.log", false)).toBe(true);
      });

      it("should NOT exclude regular source files", () => {
        expect(shouldExclude("index.ts", false)).toBe(false);
        expect(shouldExclude("App.tsx", false)).toBe(false);
        expect(shouldExclude("package.json", false)).toBe(false);
        expect(shouldExclude("vite.config.ts", false)).toBe(false);
        expect(shouldExclude("README.md", false)).toBe(false);
      });
    });

    describe("nested path exclusions", () => {
      it("should exclude files inside excluded directories", () => {
        expect(shouldExclude("node_modules/react/index.js", false)).toBe(true);
        expect(shouldExclude(".git/config", false)).toBe(true);
        expect(shouldExclude("dist/bundle.js", false)).toBe(true);
      });

      it("should NOT exclude files with similar names but in valid paths", () => {
        expect(shouldExclude("src/git-utils.ts", false)).toBe(false);
        expect(shouldExclude("src/node-modules-utils.ts", false)).toBe(false);
      });
    });
  });

  describe("EXCLUDED_DIRECTORIES", () => {
    it("should include common exclusions", () => {
      expect(EXCLUDED_DIRECTORIES).toContain("node_modules");
      expect(EXCLUDED_DIRECTORIES).toContain(".git");
      expect(EXCLUDED_DIRECTORIES).toContain("dist");
      expect(EXCLUDED_DIRECTORIES).toContain(".vercel");
    });

    it("should have reasonable number of exclusions", () => {
      expect(EXCLUDED_DIRECTORIES.length).toBeGreaterThan(10);
      expect(EXCLUDED_DIRECTORIES.length).toBeLessThan(50);
    });
  });

  describe("EXCLUDED_FILE_PATTERNS", () => {
    it("should have patterns for env files", () => {
      const hasEnvPattern = EXCLUDED_FILE_PATTERNS.some((p) =>
        p.test(".env.local"),
      );
      expect(hasEnvPattern).toBe(true);
    });

    it("should have patterns for log files", () => {
      const hasLogPattern = EXCLUDED_FILE_PATTERNS.some((p) =>
        p.test("debug.log"),
      );
      expect(hasLogPattern).toBe(true);
    });
  });
});
