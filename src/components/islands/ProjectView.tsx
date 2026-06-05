import { useState, useTransition } from "react"

type Task = {
  id: string; text: string; category: string; status: string
  priority: string; blockedBy: string | null; notes: string | null; order: number
}
type Milestone = { id: string; name: string; theme: string | null; order: number; tasks: Task[] }
type Phase = { id: string; name: string; subtitle: string | null; color: string; order: number; milestones: Milestone[] }

const CAT_COLOR: Record<string, string> = {
  SETUP:"#0EA5E9",DEPS:"#F59E0B",FALLBACK:"#6B7280",DEV:"#8B5CF6",MODEL:"#EC4899",
  BUILD:"#3B82F6",POLISH:"#14B8A6",DEPLOY:"#10B981",UAT:"#F97316",DOCS:"#84CC16",
  BUFFER:"#6B7280",ENHANCE:"#A78BFA",HANDOVER:"#34D399",RESEARCH:"#60A5FA",MEETING:"#F472B6"
}
const CAT_LABEL: Record<string, string> = {
  SETUP:"Setup",DEPS:"Dependency",FALLBACK:"Fallback",DEV:"Dev",MODEL:"Model",
  BUILD:"Build",POLISH:"Polish",DEPLOY:"Deploy",UAT:"UAT",DOCS:"Docs",
  BUFFER:"Buffer",ENHANCE:"Enhance",HANDOVER:"Handover",RESEARCH:"Research",MEETING:"Meeting"
}

function computeProgress(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string, status: string) => void }) {
  const done    = task.status === "DONE"
  const color   = CAT_COLOR[task.category] ?? "#6B7280"
  const label   = CAT_LABEL[task.category] ?? task.category

  const next = (s: string) => s === "PENDING" ? "IN_PROGRESS" : s === "IN_PROGRESS" ? "DONE" : "PENDING"

  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${done ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(task.id, next(task.status))}
        className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
        {done ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        ) : task.status === "IN_PROGRESS" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        ) : task.status === "BLOCKED" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${done ? "line-through text-gray-500" : "text-gray-200"}`}>
          {task.text}
        </p>
        {task.blockedBy && (
          <p className="text-xs text-amber-400 mt-0.5">⚠ Blocked by: {task.blockedBy}</p>
        )}
      </div>

      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
        style={{ background: color + "20", color }}>
        {label}
      </span>
    </div>
  )
}

function MilestoneBlock({ milestone, phaseColor, onToggle }: {
  milestone: Milestone; phaseColor: string; onToggle: (id: string, status: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const done  = milestone.tasks.filter(t => t.status === "DONE").length
  const total = milestone.tasks.length
  const pct   = computeProgress(done, total)

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden mb-3">
      <button onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {collapsed
            ? <polyline points="9 18 15 12 9 6"/>
            : <polyline points="6 9 12 15 18 9"/>
          }
        </svg>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white">{milestone.name}</span>
          {milestone.theme && <span className="text-xs text-gray-500 ml-2">{milestone.theme}</span>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-20 h-1.5 rounded-full bg-white/[0.06]">
            <div className="h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct === 100 ? "#10B981" : phaseColor }} />
          </div>
          <span className="text-xs text-gray-500 w-10 text-right">{done}/{total}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-white/[0.04]">
          {milestone.tasks.map(task => (
            <TaskRow key={task.id} task={task} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectView({ phases }: { phases: Phase[] }) {
  const [localPhases, setLocalPhases] = useState(phases)
  const [activePhase, setActivePhase] = useState(phases[0]?.id ?? "")
  const [, startTransition]           = useTransition()

  const handleToggle = (taskId: string, newStatus: string) => {
    setLocalPhases(prev => prev.map(ph => ({
      ...ph,
      milestones: ph.milestones.map(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }))
    })))

    startTransition(async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      })
    })
  }

  const current = localPhases.find(p => p.id === activePhase) ?? localPhases[0]
  if (!current) return <p className="text-gray-500 p-8">No phases yet.</p>

  return (
    <div>
      {/* Phase tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {localPhases.map(phase => {
          const tasks = phase.milestones.flatMap(m => m.tasks)
          const done  = tasks.filter(t => t.status === "DONE").length
          const pct   = computeProgress(done, tasks.length)
          const active = phase.id === activePhase

          return (
            <button key={phase.id} onClick={() => setActivePhase(phase.id)}
              className="flex-1 min-w-36 p-3 rounded-xl border text-left transition-all"
              style={{
                borderColor: active ? phase.color : "rgba(255,255,255,0.06)",
                background:  active ? phase.color + "18" : undefined
              }}>
              <div className="text-sm font-medium mb-0.5"
                style={{ color: active ? phase.color : "#fff" }}>
                {phase.name}
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {phase.subtitle} · {done}/{tasks.length}
              </div>
              <div className="h-1 rounded-full bg-white/[0.06]">
                <div className="h-1 rounded-full"
                  style={{ width: `${pct}%`, background: phase.color }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Milestones */}
      {current.milestones.map(m => (
        <MilestoneBlock key={m.id} milestone={m} phaseColor={current.color} onToggle={handleToggle} />
      ))}
    </div>
  )
}
