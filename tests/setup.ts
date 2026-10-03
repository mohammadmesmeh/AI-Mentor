import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { cleanup } from "@testing-library/react"
import { server } from "./msw/server"
import { resetMockState } from "./msw/handlers"

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetMockState()
})
afterAll(() => server.close())

process.env.NEXT_PUBLIC_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"