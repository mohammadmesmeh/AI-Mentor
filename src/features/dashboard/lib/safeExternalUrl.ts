/**
 * Roadmap resources are AI-generated and therefore untrusted (constitution IV,
 * spec 007 FR-017). Only absolute http(s) URLs may become clickable links —
 * this rejects `javascript:`, `data:`, relative and malformed values.
 */
export function safeExternalUrl(url: string): string | null {
  try {
    const { protocol } = new URL(url)
    return protocol === "http:" || protocol === "https:" ? url : null
  } catch {
    return null
  }
}
