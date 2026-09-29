import "@testing-library/jest-dom/vitest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { http, HttpResponse } from "msw"
import { server } from "@tests/msw/server"
import authReducer, { sessionEstablished } from "@/redux/slices/authSlice"
import { apiSlice } from "@/lib/api/apiSlice"
import { setSession, clearSession } from "@/lib/api/auth"
import type { User } from "@/lib/api/types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}))

const TEST_USER: User = {
  id: "u1",
  name: "Test User",
  email: "test@example.com",
  status: "active",
  emailVerifiedAt: null,
  lastLoginAt: null,
  createdAt: new Date().toISOString(),
}

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (gdm) => gdm().concat(apiSlice.middleware),
  })
}

// Minimal harness mirroring how Navbar triggers sign-out (FR-006): it fires the
// mutation without awaiting the network.
function SignOutButton() {
  const [logout] = apiSlice.useLogoutMutation()
  return (
    <button type="button" onClick={() => logout()}>
      Logout
    </button>
  )
}

describe("sign-out clears local state immediately (FR-006)", () => {
  beforeEach(() => {
    clearSession()
  })

  it("T015: logout clears isAuthenticated/user state even when POST /auth/logout fails", async () => {
    server.use(
      http.post(`${API_BASE}/auth/logout`, () => {
        return HttpResponse.json(
          { error: { code: "internal_error", message: "boom" }, meta: { request_id: "r-fail" } },
          { status: 500 }
        )
      })
    )

    const store = makeStore()
    setSession({
      tokenType: "Bearer",
      accessToken: "access",
      expiresAt: Date.now() + 900000,
    })

    store.dispatch(sessionEstablished(TEST_USER))

    const user = userEvent.setup()
    render(
      <Provider store={store}>
        <SignOutButton />
      </Provider>
    )

    await user.click(screen.getByRole("button", { name: "Logout" }))

    const state = store.getState().auth
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })
})