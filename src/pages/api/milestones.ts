import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { getSession } from "../../../lib/session"

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const body = await request.json() as {
    phaseId: string
    name:    string
    theme?:  string
  }

  if (!body.phaseId || !body.name?.trim()) {
    return new Response("Missing required fields", { status: 400 })
  }

  // Verify phase belongs to user
  const phase = await prisma.phase.findFirst({
    where:   { id: body.phaseId },
    include: { project: true }
  })
  if (!phase || phase.project.userId !== session.id) {
    return new Response("Not found", { status: 404 })
  }

  const lastMilestone = await prisma.milestone.findFirst({
    where:   { phaseId: body.phaseId },
    orderBy: { order: "desc" },
    select:  { order: true }
  })

  const milestone = await prisma.milestone.create({
    data: {
      phaseId: body.phaseId,
      name:    body.name.trim(),
      theme:   body.theme?.trim() || null,
      order:   (lastMilestone?.order ?? 0) + 1,
    },
    include: { tasks: true }
  })

  return new Response(JSON.stringify(milestone), {
    status:  201,
    headers: { "Content-Type": "application/json" }
  })
}
