import { describe, it, expect } from "vitest";
import { isAnonymizedEmail, ANONYMIZED_EMAIL_DOMAIN } from "@/lib/anonymize";

describe("isAnonymizedEmail", () => {
  it("true pour un email sentinelle", () => {
    expect(isAnonymizedEmail(`deleted-abc${ANONYMIZED_EMAIL_DOMAIN}`)).toBe(true);
  });
  it("false pour un email normal", () => {
    expect(isAnonymizedEmail("brice@example.com")).toBe(false);
  });
});
