import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Regression tests to ensure scaffold template ships with ABBA branding
 * and no Dyad artifacts remain in generated app templates.
 */
describe("scaffold template branding", () => {
  const scaffoldPath = path.join(__dirname, "..", "..", "scaffold");
  const publicPath = path.join(scaffoldPath, "public");

  describe("favicon assets exist", () => {
    it("should have favicon.ico", () => {
      const faviconPath = path.join(publicPath, "favicon.ico");
      expect(fs.existsSync(faviconPath)).toBe(true);
    });

    it("should have apple-touch-icon.png", () => {
      const appleTouchIconPath = path.join(publicPath, "apple-touch-icon.png");
      expect(fs.existsSync(appleTouchIconPath)).toBe(true);
    });

    it("should have site.webmanifest", () => {
      const webmanifestPath = path.join(publicPath, "site.webmanifest");
      expect(fs.existsSync(webmanifestPath)).toBe(true);
    });
  });

  describe("index.html has favicon links", () => {
    const indexHtmlPath = path.join(scaffoldPath, "index.html");
    const indexHtml = fs.readFileSync(indexHtmlPath, "utf-8");

    it("should have favicon link", () => {
      expect(indexHtml).toContain('rel="icon"');
      expect(indexHtml).toContain("favicon.ico");
    });

    it("should have apple-touch-icon link", () => {
      expect(indexHtml).toContain('rel="apple-touch-icon"');
      expect(indexHtml).toContain("apple-touch-icon.png");
    });

    it("should have manifest link", () => {
      expect(indexHtml).toContain('rel="manifest"');
      expect(indexHtml).toContain("site.webmanifest");
    });
  });

  describe("ABBA branding is present", () => {
    it("site.webmanifest should have ABBA name", () => {
      const webmanifestPath = path.join(publicPath, "site.webmanifest");
      const webmanifest = JSON.parse(fs.readFileSync(webmanifestPath, "utf-8"));
      expect(webmanifest.name).toContain("ABBA");
    });

    it("site.webmanifest should have ABBA short_name", () => {
      const webmanifestPath = path.join(publicPath, "site.webmanifest");
      const webmanifest = JSON.parse(fs.readFileSync(webmanifestPath, "utf-8"));
      expect(webmanifest.short_name).toBe("ABBA");
    });
  });

  describe("no Dyad branding remains", () => {
    it("site.webmanifest should not contain 'dyad' (case-insensitive)", () => {
      const webmanifestPath = path.join(publicPath, "site.webmanifest");
      const content = fs.readFileSync(webmanifestPath, "utf-8").toLowerCase();
      expect(content).not.toContain("dyad");
    });

    it("index.html should not contain 'dyad' in meta/link tags (case-insensitive)", () => {
      const indexHtmlPath = path.join(scaffoldPath, "index.html");
      const content = fs.readFileSync(indexHtmlPath, "utf-8").toLowerCase();
      // Check head section for dyad references (not in script content)
      const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/);
      if (headMatch) {
        expect(headMatch[1]).not.toContain("dyad");
      }
    });

    it("favicon.ico should not be named with dyad", () => {
      const publicFiles = fs.readdirSync(publicPath);
      const dyadFiles = publicFiles.filter((f) =>
        f.toLowerCase().includes("dyad"),
      );
      expect(dyadFiles).toEqual([]);
    });
  });

  describe("favicon.ico is valid", () => {
    it("should have non-zero file size", () => {
      const faviconPath = path.join(publicPath, "favicon.ico");
      const stats = fs.statSync(faviconPath);
      expect(stats.size).toBeGreaterThan(0);
    });

    it("should have ICO magic bytes", () => {
      const faviconPath = path.join(publicPath, "favicon.ico");
      const buffer = fs.readFileSync(faviconPath);
      // ICO files start with 00 00 01 00
      expect(buffer[0]).toBe(0x00);
      expect(buffer[1]).toBe(0x00);
      expect(buffer[2]).toBe(0x01);
      expect(buffer[3]).toBe(0x00);
    });
  });
});
