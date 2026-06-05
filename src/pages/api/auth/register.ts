import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { createSession, setSessionCookie } from "../../../lib/session"
import bcrypt from "bcryptjs"

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData()
  const name     = form.get("name")     as string
  const email    = form.get("email")    as string
  const password = form.get("password") as string

  if (!email || !password || password.length < 8) {
    return redirect("/sign-up?error=invalid")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return redirect("/sign-up?error=exists")
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed }
  })

  const token = await createSession({ id: user.id, email: user.email, name: user.name })
  setSessionCookie(cookies, token)

  return redirect("/")
}
