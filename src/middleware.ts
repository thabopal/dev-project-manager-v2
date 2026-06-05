import { defineMiddleware } from "astro:middleware"
import { getSession } from "./lib/session"

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/api/auth/login",
  "/api/auth/register",
]

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url
  const isPublic     = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (isPublic) return next()

  const session = await getSession(context.cookies)
  if (!session) return context.redirect("/sign-in")

  context.locals.user = session
  return next()
})