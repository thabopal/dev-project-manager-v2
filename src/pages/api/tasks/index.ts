import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { getSession } from "../../../lib/session"
import type { TaskCategory, Priority } from "@prisma/client"

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const body = await request.json() as {
    milestoneId: string
    text:        string
    category:    string
    priority?:   string
    blockedBy?:  string
  }

  if (!body.milestoneId || !body.text?.trim() || !body.category) {
    return new Response("Missing required fields", { status: 400 })
  }

  // Verify the milestone belongs to this user
  const milestone = await prisma.milestone.findFirst({
    where: { id: body.milestoneId },
    include: { phase: { include: { project: true } } }
  })

  if (!milestone || milestone.phase.project.userId !== session.id) {
    return new Response("Not found", { status: 404 })
  }

  // Get the next order value
  const lastTask = await prisma.task.findFirst({
    where:   { milestoneId: body.milestoneId },
    orderBy: { order: "desc" },
    select:  { order: true }
  })

  const task = await prisma.task.create({
    data: {
      milestoneId: body.milestoneId,
      text:        body.text.trim(),
      category:    body.category as TaskCategory,
      priority:    (body.priority ?? "MEDIUM") as Priority,
      blockedBy:   body.blockedBy?.trim() || null,
      status:      "PENDING",
      order:       (lastTask?.order ?? 0) + 1,
    }
  })

  return new Response(JSON.stringify(task), {
    status:  201,
    headers: { "Content-Type": "application/json" }
  })
}
