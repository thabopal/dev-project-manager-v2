import type { APIRoute } from "astro"
import { clearSessionCookie } from "../../../lib/session"

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSessionCookie(cookies)
  return redirect("/sign-in")
}
