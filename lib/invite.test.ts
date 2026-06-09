import { describe, it, expect, afterEach } from "vitest";
import { buildInviteUrl } from "@/lib/invite";

describe("buildInviteUrl", () => {
  const orig = process.env.APP_BASE_URL;
  afterEach(() => {
    if (orig === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = orig;
  });

  it("construit l'URL complète", () => {
    process.env.APP_BASE_URL = "https://x.test";
    expect(buildInviteUrl("tok")).toBe("https://x.test/invite/tok");
  });

  it("retire le slash final de la base", () => {
    process.env.APP_BASE_URL = "https://x.test/";
    expect(buildInviteUrl("tok")).toBe("https://x.test/invite/tok");
  });

  it("retombe sur un chemin relatif si APP_BASE_URL absent", () => {
    delete process.env.APP_BASE_URL;
    expect(buildInviteUrl("tok")).toBe("/invite/tok");
  });
});
