const IDEMPOTENCY_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/

/**
 * Generates an idempotency key matching API_CONTRACT.md §14's format: 8–128
 * safe ASCII characters (letters, numbers, `.`, `_`, `:`, `-`) starting with
 * a letter or number. A UUID qualifies, but this also guards the fallback
 * path for environments without `crypto.randomUUID`.
 */
export function createIdempotencyKey(): string {
  let key: string | undefined

  if (typeof globalThis.crypto?.randomUUID === "function") {
    key = globalThis.crypto.randomUUID()
  }

  if (!key) {
    const random = (size: number) =>
      Array.from({ length: size }, () =>
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
          Math.floor(Math.random() * 62)
        )
      ).join("")
    key = `${random(8)}-${random(4)}-${random(4)}-${Date.now().toString(36)}`
  }

  return key.length >= 8 && IDEMPOTENCY_PATTERN.test(key) ? key : "gen-" + key
}