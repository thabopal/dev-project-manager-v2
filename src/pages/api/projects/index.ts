import type { APIRoute } from "astro"
import { prisma } from "../../../lib/prisma"
import { getSession } from "../../../lib/session"
import type { ProjectType } from "@prisma/client"

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const body = await request.json() as {
    name: string; description?: string; type: ProjectType
    color?: string; stack?: string[]; client?: string; dueDate?: string
  }

  const project = await prisma.project.create({
    data: {
      userId:      session.id,
      name:        body.name,
      description: body.description,
      type:        body.type,
      color:       body.color ?? "#0EA5E9",
      stack:       body.stack ?? [],
      client:      body.client,
      dueDate:     body.dueDate ? new Date(body.dueDate) : null,
    }
  })

  return new Response(JSON.stringify(project), {
    status:  201,
    headers: { "Content-Type": "application/json" }
  })
}
