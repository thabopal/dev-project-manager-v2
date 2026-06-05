import type { TaskCategory, TaskStatus, Priority, ProjectType } from "@prisma/client"

export function computeProgress(done: number, total: number): number {
  if (total === 0) return 0
  return Math.round((done / total) * 100)
}

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  SETUP:    { label: "Setup",      color: "#0EA5E9" },
  DEPS:     { label: "Dependency", color: "#F59E0B" },
  FALLBACK: { label: "Fallback",   color: "#6B7280" },
  DEV:      { label: "Dev",        color: "#8B5CF6" },
  MODEL:    { label: "Model",      color: "#EC4899" },
  BUILD:    { label: "Build",      color: "#3B82F6" },
  POLISH:   { label: "Polish",     color: "#14B8A6" },
  DEPLOY:   { label: "Deploy",     color: "#10B981" },
  UAT:      { label: "UAT",        color: "#F97316" },
  DOCS:     { label: "Docs",       color: "#84CC16" },
  BUFFER:   { label: "Buffer",     color: "#6B7280" },
  ENHANCE:  { label: "Enhance",    color: "#A78BFA" },
  HANDOVER: { label: "Handover",   color: "#34D399" },
  RESEARCH: { label: "Research",   color: "#60A5FA" },
  MEETING:  { label: "Meeting",    color: "#F472B6" },
}

export const STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PENDING:     { label: "Pending",     color: "#6B7280" },
  IN_PROGRESS: { label: "In Progress", color: "#0EA5E9" },
  BLOCKED:     { label: "Blocked",     color: "#EF4444" },
  DONE:        { label: "Done",        color: "#10B981" },
  SKIPPED:     { label: "Skipped",     color: "#6B7280" },
}

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  LOW:      { label: "Low",      color: "#6B7280" },
  MEDIUM:   { label: "Medium",   color: "#0EA5E9" },
  HIGH:     { label: "High",     color: "#F59E0B" },
  CRITICAL: { label: "Critical", color: "#EF4444" },
}

export const PROJECT_TYPE_META: Record<ProjectType, { label: string; icon: string }> = {
  INSTITUTIONAL: { label: "Institutional", icon: "🏛️" },
  SAAS_PRODUCT:  { label: "SaaS Product",  icon: "🚀" },
  CLIENT:        { label: "Client",        icon: "🤝" },
  RESEARCH:      { label: "Research",      icon: "🔬" },
  PERSONAL:      { label: "Personal",      icon: "👤" },
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric", month: "short", year: "numeric"
  }).format(new Date(date))
}
