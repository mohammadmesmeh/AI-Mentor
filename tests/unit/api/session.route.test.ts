// @vitest-environment node
import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import { POST } from "@/app/api/session/[action]/route"

// The server side of the session route: cookie attributes, rotation, clearing,
// and the cross-site guard.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"
const ORIGIN = "http://localhost:3000"

function call(action: string, { body, cookie, headers = {} }: { body?: unknown; cookie?: string; headers?: Record<string, string> } = {}) {
  const request = new NextRequest(`${ORIGIN}/api/session/${action}`, {
    method: "POST",
    headers: {
      origin: ORIGIN,
      "x-masar-session": "1",
      "content-type": "application/json",
      ...(cookie ? { cookie: `masar_session=${cookie}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return POST(request, { params: Promise.resolve({ action }) })
}

const authResponse = (refreshToken: string) =>
  HttpResponse.json({
    data: {
      token_type: "Bearer",
      access_token: "access-from-backend",
      expires_in: 900,
      refresh_token: refreshToken,
      refresh_expires_in: 2592000,
      user: { id: "u1" },
    },
    meta: { request_id: "t" },
  })

const failure = (code: string, status: number) =>
  HttpResponse.json({ error: { code, message: code }, meta: { request_id: "t" } }, { status })

describe("POST /api/session/*", () => {
  it("store: sets an HttpOnly, Secure, SameSite=Lax cookie scoped to /api/session", async () => {
    const response = await call("store", { body: { refresh_token: "a".repeat(64), refresh_expires_in: 2592000 } })
    expect(response.status).toBe(204)
    const cookie = response.headers.get("set-cookie") ?? ""
    expect(cookie).toContain(`masar_session=${"a".repeat(64)}`)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Secure/i)
    expect(cookie).toMatch(/SameSite=lax/i)
    expect(cookie).toContain("Path=/api/session")
    expect(cookie).toContain("Max-Age=2592000")
  })

  it("store: rejects a missing token", async () => {
    const response = await call("store", { body: {} })
    expect(response.status).toBe(422)
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("refresh: rotates the cookie and returns only the access token and user", async () => {
    let sent: unknown
    server.use(
      http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
        sent = await request.json()
        return authResponse("rotated-refresh-token-0001")
      })
    )
    const response = await call("refresh", { cookie: "old-refresh-token-00000001" })
    expect(sent).toEqual({ refresh_token: "old-refresh-token-00000001" })
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.data).toEqual({ token_type: "Bearer", access_token: "access-from-backend", expires_in: 900, user: { id: "u1" } })
    expect(JSON.stringify(json)).not.toContain("rotated-refresh-token-0001")
    expect(response.headers.get("set-cookie")).toContain("masar_session=rotated-refresh-token-0001")
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("refresh: without a cookie answers 401 and never calls the backend", async () => {
    let called = false
    server.use(http.post(`${API_BASE}/auth/refresh`, () => ((called = true), authResponse("x"))))
    const response = await call("refresh")
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe("unauthenticated")
    expect(called).toBe(false)
  })

  it("refresh: an expired or revoked token (401) clears the cookie and passes the error through", async () => {
    server.use(http.post(`${API_BASE}/auth/refresh`, () => failure("unauthenticated", 401)))
    const response = await call("refresh", { cookie: "revoked-refresh-token-0001" })
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe("unauthenticated")
    expect(response.headers.get("set-cookie")).toMatch(/masar_session=;.*Max-Age=0/i)
  })

  it("refresh: a temporary failure (503) keeps the cookie", async () => {
    server.use(http.post(`${API_BASE}/auth/refresh`, () => failure("authentication_service_unavailable", 503)))
    const response = await call("refresh", { cookie: "valid-refresh-token-00001" })
    expect(response.status).toBe(503)
    expect(response.headers.get("set-cookie")).toBeNull()
  })

  it("refresh: two requests with the same cookie share one backend call (no reuse detection)", async () => {
    let calls = 0
    server.use(
      http.post(`${API_BASE}/auth/refresh`, async () => {
        calls += 1
        await new Promise((r) => setTimeout(r, 20))
        return authResponse("rotated-once-000000000001")
      })
    )
    const [a, b] = await Promise.all([
      call("refresh", { cookie: "shared-refresh-token-0001" }),
      call("refresh", { cookie: "shared-refresh-token-0001" }),
    ])
    expect(calls).toBe(1)
    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
  })

  it("refresh: forwards the learner's IP so the backend's per-IP limit isn't shared by every user", async () => {
    let forwarded: string | null = null
    server.use(
      http.post(`${API_BASE}/auth/refresh`, ({ request }) => {
        forwarded = request.headers.get("x-forwarded-for")
        return authResponse("rotated-ip-000000000001")
      })
    )
    await call("refresh", { cookie: "ip-refresh-token-00000001", headers: { "x-forwarded-for": "203.0.113.7" } })
    expect(forwarded).toBe("203.0.113.7")
  })

  it("refresh: a 429 keeps the cookie, passes Retry-After through, and isn't reused for the retry", async () => {
    let calls = 0
    server.use(
      http.post(`${API_BASE}/auth/refresh`, () => {
        calls += 1
        return calls === 1
          ? HttpResponse.json(
              { error: { code: "rate_limited", message: "Too many" }, meta: { request_id: "t" } },
              { status: 429, headers: { "Retry-After": "7" } }
            )
          : authResponse("rotated-after-429-000001")
      })
    )
    const limited = await call("refresh", { cookie: "limited-refresh-token-001" })
    expect(limited.status).toBe(429)
    expect(limited.headers.get("retry-after")).toBe("7")
    expect(limited.headers.get("set-cookie")).toBeNull()

    // The retry (after Retry-After) reaches the backend instead of a cached 429.
    const retried = await call("refresh", { cookie: "limited-refresh-token-001" })
    expect(retried.status).toBe(200)
    expect(calls).toBe(2)
  })

  it("refresh: a tab restoring right after another, with the just-rotated cookie, shares its backend call", async () => {
    let calls = 0
    server.use(
      http.post(`${API_BASE}/auth/refresh`, () => {
        calls += 1
        return authResponse(`rotated-by-tab-${calls}-0000000001`)
      })
    )
    const first = await call("refresh", { cookie: "tabs-refresh-token-000001" })
    expect(first.headers.get("set-cookie")).toContain("masar_session=rotated-by-tab-1-0000000001")
    const second = await call("refresh", { cookie: "rotated-by-tab-1-0000000001" })
    expect(second.status).toBe(200)
    expect(calls).toBe(1)
  })

  it("logout: revokes with the bearer and the cookie's refresh token, then clears the cookie", async () => {
    let sent: unknown
    server.use(
      http.post(`${API_BASE}/auth/logout`, async ({ request }) => {
        sent = { auth: request.headers.get("authorization"), body: await request.json() }
        return new HttpResponse(null, { status: 204 })
      })
    )
    const response = await call("logout", { cookie: "current-refresh-token-001", headers: { authorization: "Bearer acc" } })
    expect(sent).toEqual({ auth: "Bearer acc", body: { refresh_token: "current-refresh-token-001" } })
    expect(response.status).toBe(204)
    expect(response.headers.get("set-cookie")).toMatch(/masar_session=;.*Max-Age=0/i)
  })

  it("logout: clears the cookie even when the backend fails", async () => {
    server.use(http.post(`${API_BASE}/auth/logout`, () => HttpResponse.error()))
    const response = await call("logout", { cookie: "current-refresh-token-002", headers: { authorization: "Bearer acc" } })
    expect(response.status).toBe(204)
    expect(response.headers.get("set-cookie")).toMatch(/Max-Age=0/i)
  })

  it("rejects cross-site requests and requests without the client header", async () => {
    expect((await call("refresh", { cookie: "x".repeat(20), headers: { origin: "https://evil.example" } })).status).toBe(403)
    const noHeader = new NextRequest(`${ORIGIN}/api/session/refresh`, { method: "POST", headers: { origin: ORIGIN } })
    expect((await POST(noHeader, { params: Promise.resolve({ action: "refresh" }) })).status).toBe(403)
  })

  it("unknown actions are 404", async () => {
    expect((await call("login")).status).toBe(404)
  })
})
