import { SignJWT, jwtVerify } from "jose"
import type { AstroCookies } from "astro"

const secret = process.env.SESSION_SECRET ?? "fallback-dev-secret"
const key    = new TextEncoder().encode(secret)

export type SessionUser = {
  id:    string
  email: string
  name:  string | null
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key)
}

export async function getSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const token = cookies.get("session")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set("session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7,
    path:     "/",
  })
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete("session", { path: "/" })
}