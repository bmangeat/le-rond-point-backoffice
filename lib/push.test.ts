import { describe, it, expect, afterEach } from "vitest";
import { isPushConfigured } from "@/lib/push";

const KEYS = [
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
] as const;

describe("isPushConfigured", () => {
  const orig = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of KEYS) {
      if (orig[k] === undefined) delete process.env[k];
      else process.env[k] = orig[k];
    }
  });

  it("false si une clé manque", () => {
    for (const k of KEYS) delete process.env[k];
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "x";
    expect(isPushConfigured()).toBe(false);
  });

  it("true si toutes les clés sont présentes", () => {
    for (const k of KEYS) process.env[k] = "x";
    expect(isPushConfigured()).toBe(true);
  });
});
