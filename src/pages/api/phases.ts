import type { APIRoute } from "astro"
import { prisma } from "../../lib/prisma"
import { getSession } from "../../lib/session"

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const body = await request.json() as {
    projectId: string
    name:      string
    subtitle?: string
    color?:    string
  }

  if (!body.projectId || !body.name?.trim()) {
    return new Response("Missing required fields", { status: 400 })
  }

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: body.projectId, userId: session.id }
  })
  if (!project) return new Response("Not found", { status: 404 })

  const lastPhase = await prisma.phase.findFirst({
    where:   { projectId: body.projectId },
    orderBy: { order: "desc" },
    select:  { order: true }
  })

  const phase = await prisma.phase.create({
    data: {
      projectId: body.projectId,
      name:      body.name.trim(),
      subtitle:  body.subtitle?.trim() || null,
      color:     body.color ?? "#7C3AED",
      order:     (lastPhase?.order ?? 0) + 1,
    },
    include: { milestones: { include: { tasks: true } } }
  })

  return new Response(JSON.stringify(phase), {
    status:  201,
    headers: { "Content-Type": "application/json" }
  })
}
