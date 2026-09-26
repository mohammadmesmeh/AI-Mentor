import { describe, expect, it } from "vitest"
import { safeExternalUrl } from "@/features/dashboard/lib/safeExternalUrl"

describe("safeExternalUrl", () => {
  it.each(["https://laravel.com/docs", "http://example.com/a?b=1#c"])("accepts %s", (url) => {
    expect(safeExternalUrl(url)).toBe(url)
  })

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "/relative/path",
    "//evil.example.com",
    "",
    "not a url",
    "ftp://example.com/file",
  ])("rejects %j", (url) => {
    expect(safeExternalUrl(url)).toBeNull()
  })
})
