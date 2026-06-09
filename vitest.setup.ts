// Le runtime Next.js expose `crypto` globalement ; l'env node de vitest (Node 18)
// non. On le polyfille pour les tests (Web Crypto standard).
import { webcrypto } from "node:crypto";

if (!globalThis.crypto) {
  // @ts-expect-error — webcrypto satisfait l'API utilisée (getRandomValues)
  globalThis.crypto = webcrypto;
}
