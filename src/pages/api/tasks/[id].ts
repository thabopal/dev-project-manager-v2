import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { getSession } from "../../../lib/session"

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = params
  const body = await request.json()

  const task = await prisma.task.findFirst({
    where:   { id },
    include: { milestone: { include: { phase: { include: { project: true } } } } }
  })

  if (!task || task.milestone.phase.project.userId !== session.id) {
    return new Response("Not found", { status: 404 })
  }

  const updated = await prisma.task.update({
    where: { id },
    data:  {
      ...body,
      completedAt: body.status === "DONE" ? new Date() : body.status ? null : undefined,
      updatedAt:   new Date(),
    }
  })

  return new Response(JSON.stringify(updated), {
    headers: { "Content-Type": "application/json" }
  })
}
