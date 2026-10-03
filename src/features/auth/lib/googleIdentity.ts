/**
 * Google Identity Services (GIS) for `POST /auth/google` (API_CONTRACT.md §7).
 *
 * GIS hands out an ID token only through Google's own rendered button (or One
 * Tap), so the auth forms render that button. The script loads on demand, once
 * per page, only where the button is shown. There is no redirect URI and no
 * client secret: the public Web OAuth Client ID is all the frontend needs, and
 * it must match the backend's GOOGLE_CLIENT_ID.
 */

/** The public Web OAuth Client ID; empty when Google sign-in isn't configured. */
export function googleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
}

const GIS_SRC = "https://accounts.google.com/gsi/client"

export interface GoogleCredentialResponse {
  /** The ID token (a JWT). A credential: never logged, stored, or put in a URL. */
  credential?: string
}

export interface GoogleButtonOptions {
  type: "standard"
  theme: "outline" | "filled_black"
  size: "large"
  text: "continue_with"
  shape: "pill"
  logo_alignment: "left" | "center"
  width: number
  locale: string
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: "popup"
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    itp_support?: boolean
  }): void
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } }
  }
}

let loading: Promise<GoogleAccountsId> | null = null

/** Loads the GIS script once; rejects if it can't be loaded (offline, blocked). */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (typeof window === "undefined") return Promise.reject(new Error("GIS needs a browser"))
  const ready = window.google?.accounts?.id
  if (ready) return Promise.resolve(ready)
  if (!loading) {
    loading = new Promise<GoogleAccountsId>((resolve, reject) => {
      const script = document.createElement("script")
      script.src = GIS_SRC
      script.async = true
      script.defer = true
      script.onload = () => {
        const id = window.google?.accounts?.id
        if (id) resolve(id)
        else reject(new Error("GIS loaded without accounts.id"))
      }
      script.onerror = () => reject(new Error("GIS failed to load"))
      document.head.appendChild(script)
    }).catch((error: unknown) => {
      // Let a later attempt try again.
      loading = null
      throw error
    })
  }
  return loading
}

/** Tests only. */
export function resetGoogleIdentityForTests() {
  loading = null
}
