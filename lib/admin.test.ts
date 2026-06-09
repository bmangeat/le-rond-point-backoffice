import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks : on évite de charger NextAuth/Prisma réels.
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error("REDIRECT:" + url);
  }),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertSuperAdmin, requireSuperAdmin } from "@/lib/admin";

const mAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mFind = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;

const superAdmin = {
  id: "1",
  email: "a@b.c",
  name: "A",
  image: null,
  role: "SUPER_ADMIN",
  isActive: true,
};

beforeEach(() => vi.clearAllMocks());

describe("assertSuperAdmin", () => {
  it("lève UNAUTHENTICATED sans session", async () => {
    mAuth.mockResolvedValue(null);
    await expect(assertSuperAdmin()).rejects.toThrow("UNAUTHENTICATED");
  });

  it("lève FORBIDDEN pour un non-super-admin", async () => {
    mAuth.mockResolvedValue({ user: { email: "a@b.c" } });
    mFind.mockResolvedValue({ ...superAdmin, role: "ADMIN" });
    await expect(assertSuperAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("lève FORBIDDEN pour un super-admin inactif", async () => {
    mAuth.mockResolvedValue({ user: { email: "a@b.c" } });
    mFind.mockResolvedValue({ ...superAdmin, isActive: false });
    await expect(assertSuperAdmin()).rejects.toThrow("FORBIDDEN");
  });

  it("renvoie l'admin pour un super-admin actif", async () => {
    mAuth.mockResolvedValue({ user: { email: "a@b.c" } });
    mFind.mockResolvedValue(superAdmin);
    await expect(assertSuperAdmin()).resolves.toMatchObject({ id: "1" });
  });
});

describe("requireSuperAdmin", () => {
  it("redirige vers /login sans session", async () => {
    mAuth.mockResolvedValue(null);
    await expect(requireSuperAdmin()).rejects.toThrow("REDIRECT:/login");
  });

  it("redirige vers /403 pour un non-super-admin", async () => {
    mAuth.mockResolvedValue({ user: { email: "a@b.c" } });
    mFind.mockResolvedValue({ ...superAdmin, role: "MEMBER" });
    await expect(requireSuperAdmin()).rejects.toThrow("REDIRECT:/403");
  });

  it("renvoie l'admin pour un super-admin actif", async () => {
    mAuth.mockResolvedValue({ user: { email: "a@b.c" } });
    mFind.mockResolvedValue(superAdmin);
    await expect(requireSuperAdmin()).resolves.toMatchObject({ id: "1" });
  });
});
