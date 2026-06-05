import { useState, useTransition } from "react"

type Task = {
  id: string; text: string; category: string; status: string
  priority: string; blockedBy: string | null; notes: string | null; order: number
}
type Milestone = { id: string; name: string; theme: string | null; order: number; tasks: Task[] }
type Phase = { id: string; name: string; subtitle: string | null; color: string; order: number; milestones: Milestone[] }

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  SETUP:    { label:"Setup",      color:"#7C3AED", bg:"#F5F3FF" },
  DEPS:     { label:"Dependency", color:"#D97706", bg:"#FFFBEB" },
  FALLBACK: { label:"Fallback",   color:"#6B7280", bg:"#F9FAFB" },
  DEV:      { label:"Dev",        color:"#7C3AED", bg:"#F5F3FF" },
  MODEL:    { label:"Model",      color:"#DB2777", bg:"#FDF2F8" },
  BUILD:    { label:"Build",      color:"#2563EB", bg:"#EFF6FF" },
  POLISH:   { label:"Polish",     color:"#0D9488", bg:"#F0FDFA" },
  DEPLOY:   { label:"Deploy",     color:"#059669", bg:"#F0FDF4" },
  UAT:      { label:"UAT",        color:"#EA580C", bg:"#FFF7ED" },
  DOCS:     { label:"Docs",       color:"#65A30D", bg:"#F7FEE7" },
  BUFFER:   { label:"Buffer",     color:"#6B7280", bg:"#F9FAFB" },
  ENHANCE:  { label:"Enhance",    color:"#7C3AED", bg:"#F5F3FF" },
  HANDOVER: { label:"Handover",   color:"#059669", bg:"#F0FDF4" },
  RESEARCH: { label:"Research",   color:"#2563EB", bg:"#EFF6FF" },
  MEETING:  { label:"Meeting",    color:"#DB2777", bg:"#FDF2F8" },
}

function computeProgress(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

function StatusButton({ status, onClick }: { status: string; onClick: () => void }) {
  const configs: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    DONE: {
      bg:"#059669", border:"#059669",
      icon: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    },
    IN_PROGRESS: {
      bg:"#2563EB", border:"#2563EB",
      icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 6 12 12 16 14"/></svg>
    },
    BLOCKED: {
      bg:"#DC2626", border:"#DC2626",
      icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    },
    PENDING: {
      bg:"white", border:"#D1D5DB",
      icon: null
    },
  }
  const c = configs[status] ?? configs.PENDING
  return (
    <button onClick={onClick} style={{
      width:"20px", height:"20px", borderRadius:"6px", flexShrink:0,
      background:c.bg, border:`1.5px solid ${c.border}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      cursor:"pointer", transition:"all 0.15s", padding:0
    }}>
      {c.icon}
    </button>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string, s: string) => void }) {
  const done  = task.status === "DONE"
  const cat   = CAT_META[task.category] ?? { label: task.category, color:"#6B7280", bg:"#F9FAFB" }
  const next  = (s: string) => s === "PENDING" ? "IN_PROGRESS" : s === "IN_PROGRESS" ? "DONE" : "PENDING"

  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:"10px",
      padding:"10px 16px",
      background: done ? "#FAFCFF" : "white",
      borderBottom:"1px solid #F5F3FF",
      transition:"background 0.12s",
    }}>
      <div style={{marginTop:"1px", flexShrink:0}}>
        <StatusButton status={task.status} onClick={() => onToggle(task.id, next(task.status))} />
      </div>

      <div style={{flex:1, minWidth:0}}>
        <span style={{
          fontSize:"13.5px", lineHeight:"1.5", color: done ? "#9CA3AF" : "#1A1830",
          textDecoration: done ? "line-through" : "none",
        }}>
          {task.text}
        </span>
        {task.blockedBy && (
          <div style={{marginTop:"3px", fontSize:"11.5px", color:"#DC2626", fontWeight:500}}>
            ⚠ Blocked by: {task.blockedBy}
          </div>
        )}
      </div>

      <span style={{
        fontSize:"11px", fontWeight:600, padding:"2px 8px", borderRadius:"20px",
        background:cat.bg, color:cat.color, border:`1px solid ${cat.color}25`,
        flexShrink:0, whiteSpace:"nowrap"
      }}>{cat.label}</span>
    </div>
  )
}

function MilestoneBlock({ milestone, phaseColor, onToggle }: {
  milestone: Milestone; phaseColor: string; onToggle: (id: string, s: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const done  = milestone.tasks.filter(t => t.status === "DONE").length
  const total = milestone.tasks.length
  const pct   = computeProgress(done, total)

  return (
    <div style={{
      background:"white", border:"1px solid #EDE8FF", borderRadius:"12px",
      overflow:"hidden", marginBottom:"10px",
      boxShadow:"0 1px 4px rgba(124,58,237,0.05)"
    }}>
      <button onClick={() => setCollapsed(c=>!c)} style={{
        width:"100%", display:"flex", alignItems:"center", gap:"10px",
        padding:"12px 16px", background:"none", border:"none", cursor:"pointer",
        textAlign:"left", borderBottom: collapsed ? "none" : "1px solid #F5F3FF",
        transition:"background 0.15s"
      }}
        onMouseOver={e=>(e.currentTarget.style.background="#FAFAFE")}
        onMouseOut={e=>(e.currentTarget.style.background="none")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="6 9 12 15 18 9"/>}
        </svg>
        <div style={{flex:1, minWidth:0}}>
          <span style={{fontSize:"13.5px", fontWeight:600, color:"#1A1830"}}>{milestone.name}</span>
          {milestone.theme && <span style={{fontSize:"12px", color:"#9CA3AF", marginLeft:"8px"}}>{milestone.theme}</span>}
        </div>
        <div style={{display:"flex", alignItems:"center", gap:"8px", flexShrink:0}}>
          {pct === 100 && (
            <span style={{fontSize:"11px",background:"#F0FDF4",color:"#059669",border:"1px solid #BBF7D0",padding:"1px 8px",borderRadius:"20px",fontWeight:600}}>Complete</span>
          )}
          <div style={{width:"72px", height:"5px", borderRadius:"3px", background:"#F3F4F6"}}>
            <div style={{height:"5px",borderRadius:"3px",background:pct===100?"#059669":phaseColor,width:`${pct}%`,transition:"width 0.3s"}} />
          </div>
          <span style={{fontSize:"12px",color:"#9CA3AF",minWidth:"36px",textAlign:"right"}}>{done}/{total}</span>
        </div>
      </button>

      {!collapsed && (
        <div>
          {milestone.tasks.map(t => <TaskRow key={t.id} task={t} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  )
}

export function ProjectView({ phases }: { phases: Phase[] }) {
  const [localPhases, setLocalPhases] = useState(phases)
  const [activePhase, setActivePhase] = useState(phases[0]?.id ?? "")
  const [filter, setFilter]           = useState("ALL")
  const [, startTransition]           = useTransition()

  const toggle = (taskId: string, newStatus: string) => {
    setLocalPhases(prev => prev.map(ph => ({
      ...ph,
      milestones: ph.milestones.map(m => ({
        ...m,
        tasks: m.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }))
    })))
    startTransition(async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status: newStatus })
      })
    })
  }

  const current = localPhases.find(p => p.id === activePhase) ?? localPhases[0]
  if (!current) return <p style={{color:"#9CA3AF",padding:"24px"}}>No phases yet.</p>

  const allTasks   = current.milestones.flatMap(m => m.tasks)
  const phaseDone  = allTasks.filter(t => t.status === "DONE").length
  const blocked    = allTasks.filter(t => t.status === "BLOCKED").length

  const filtered = current.milestones.map(m => ({
    ...m,
    tasks: filter === "ALL" ? m.tasks : m.tasks.filter(t => t.status === filter)
  })).filter(m => filter === "ALL" || m.tasks.length > 0)

  const FILTERS = [
    { key:"ALL",         label:"All" },
    { key:"PENDING",     label:"Pending" },
    { key:"IN_PROGRESS", label:"In Progress" },
    { key:"BLOCKED",     label:"Blocked" },
    { key:"DONE",        label:"Done" },
  ]

  return (
    <div>
      {/* Phase tabs */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"}}>
        {localPhases.map(phase => {
          const tasks  = phase.milestones.flatMap(m => m.tasks)
          const d      = tasks.filter(t => t.status === "DONE").length
          const pct    = computeProgress(d, tasks.length)
          const active = phase.id === activePhase
          return (
            <button key={phase.id} onClick={() => setActivePhase(phase.id)} style={{
              flex:"1 1 150px", padding:"12px 16px", borderRadius:"10px", textAlign:"left",
              border: `1.5px solid ${active ? phase.color : "#E5E7EB"}`,
              background: active ? phase.color + "12" : "white",
              cursor:"pointer", transition:"all 0.15s",
              boxShadow: active ? `0 2px 10px ${phase.color}25` : "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <div style={{fontSize:"13px",fontWeight:600,color: active ? phase.color : "#374151",marginBottom:"2px"}}>{phase.name}</div>
              <div style={{fontSize:"11.5px",color:"#9CA3AF",marginBottom:"8px"}}>{phase.subtitle} · {d}/{tasks.length}</div>
              <div style={{height:"4px",borderRadius:"2px",background:"#F3F4F6"}}>
                <div style={{height:"4px",borderRadius:"2px",background:pct===100?"#059669":phase.color,width:`${pct}%`,transition:"width 0.3s"}} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Filter + stats bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"13px",color:"#6B7280",fontWeight:500}}>{phaseDone} of {allTasks.length} done</span>
          {blocked > 0 && <span style={{fontSize:"12.5px",color:"#DC2626",background:"#FEF2F2",padding:"2px 10px",borderRadius:"20px",border:"1px solid #FECACA"}}>⚠ {blocked} blocked</span>}
        </div>
        <div style={{display:"flex",gap:"4px"}}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              fontSize:"12px", padding:"5px 11px", borderRadius:"8px", cursor:"pointer",
              border: filter===f.key ? "1.5px solid #7C3AED" : "1.5px solid #E5E7EB",
              background: filter===f.key ? "#F5F3FF" : "white",
              color: filter===f.key ? "#7C3AED" : "#6B7280",
              fontWeight: filter===f.key ? 600 : 400, transition:"all 0.15s"
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:"40px",color:"#9CA3AF",fontSize:"13.5px",background:"white",borderRadius:"12px",border:"1px solid #EDE8FF"}}>
          No tasks match this filter
        </div>
      ) : filtered.map(m => (
        <MilestoneBlock key={m.id} milestone={m} phaseColor={current.color} onToggle={toggle} />
      ))}
    </div>
  )
}
