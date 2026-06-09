import { describe, it, expect } from "vitest";
import { generateSecureToken, formatDate } from "@/lib/format";

describe("generateSecureToken", () => {
  it("renvoie 64 caractères hexadécimaux", () => {
    expect(generateSecureToken()).toMatch(/^[0-9a-f]{64}$/);
  });
  it("génère des tokens uniques", () => {
    expect(generateSecureToken()).not.toBe(generateSecureToken());
  });
});

describe("formatDate", () => {
  it("renvoie un tiret pour null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
  it("formate une date", () => {
    expect(formatDate(new Date("2026-06-09T12:00:00Z"))).toContain("2026");
  });
});
