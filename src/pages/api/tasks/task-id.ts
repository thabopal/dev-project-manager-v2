import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { getSession } from "../../../lib/session"
import type { TaskCategory, TaskStatus, Priority } from "@prisma/client"

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = params
  const body = await request.json() as {
    status?:    string
    text?:      string
    category?:  string
    priority?:  string
    blockedBy?: string | null
    notes?:     string | null
  }

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
      ...(body.text      !== undefined && { text:      body.text      }),
      ...(body.category  !== undefined && { category:  body.category  as TaskCategory }),
      ...(body.priority  !== undefined && { priority:  body.priority  as Priority     }),
      ...(body.blockedBy !== undefined && { blockedBy: body.blockedBy }),
      ...(body.notes     !== undefined && { notes:     body.notes     }),
      ...(body.status    !== undefined && {
        status:      body.status as TaskStatus,
        completedAt: body.status === "DONE" ? new Date() : null,
      }),
      updatedAt: new Date(),
    }
  })

  return new Response(JSON.stringify(updated), {
    headers: { "Content-Type": "application/json" }
  })
}

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { id } = params

  const task = await prisma.task.findFirst({
    where:   { id },
    include: { milestone: { include: { phase: { include: { project: true } } } } }
  })

  if (!task || task.milestone.phase.project.userId !== session.id) {
    return new Response("Not found", { status: 404 })
  }

  await prisma.task.delete({ where: { id } })

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  })
}
