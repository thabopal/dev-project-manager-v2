import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { createSession, setSessionCookie } from "../../../lib/session"
import bcrypt from "bcryptjs"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData()
  const email    = form.get("email")    as string
  const password = form.get("password") as string

  if (!email || !password) {
    return redirect("/sign-in?error=invalid")
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) {
    return redirect("/sign-in?error=invalid")
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return redirect("/sign-in?error=invalid")
  }

  const token = await createSession({ id: user.id, email: user.email, name: user.name })
  setSessionCookie(cookies, token)

  return redirect("/")
}
