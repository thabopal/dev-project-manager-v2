import { useState, useTransition, useRef } from "react"

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

const PHASE_COLORS = ["#7C3AED","#0EA5E9","#059669","#D97706","#DB2777","#EA580C","#2563EB"]
const CATEGORIES   = Object.entries(CAT_META).map(([k,v]) => ({ value:k, label:v.label }))

function computeProgress(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100)
}

// ── Shared input styles ──────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  background:"#FAFAFA", border:"1.5px solid #E5E7EB", borderRadius:"8px",
  fontSize:"13px", color:"#1A1830", padding:"8px 12px",
  fontFamily:"inherit", outline:"none", width:"100%", transition:"border-color 0.15s"
}
const sel: React.CSSProperties = { ...inp, cursor:"pointer", background:"white" }

// ── Status button ────────────────────────────────────────────────────────────
function StatusButton({ status, onClick }: { status: string; onClick: () => void }) {
  if (status === "DONE") return (
    <button onClick={onClick} style={{background:"none",border:"none",padding:0,cursor:"pointer",lineHeight:0,flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"#059669",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
    </button>
  )
  if (status === "IN_PROGRESS") return (
    <button onClick={onClick} style={{background:"none",border:"none",padding:0,cursor:"pointer",lineHeight:0,flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 6 12 12 16 14"/></svg>
      </div>
    </button>
  )
  if (status === "BLOCKED") return (
    <button onClick={onClick} style={{background:"none",border:"none",padding:0,cursor:"pointer",lineHeight:0,flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"#DC2626",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    </button>
  )
  return (
    <button onClick={onClick} style={{background:"none",border:"none",padding:0,cursor:"pointer",lineHeight:0,flexShrink:0}}>
      <div style={{width:22,height:22,borderRadius:"50%",background:"white",border:"2px solid #D1D5DB",transition:"border-color 0.15s"}}
        onMouseOver={e=>(e.currentTarget.style.borderColor="#7C3AED")}
        onMouseOut={e =>(e.currentTarget.style.borderColor="#D1D5DB")} />
    </button>
  )
}

// ── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onUpdate, onDelete }: {
  task:     Task
  onToggle: (id: string, s: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [text, setText]         = useState(task.text)
  const [category, setCategory] = useState(task.category)
  const [priority, setPriority] = useState(task.priority)
  const [blockedBy, setBlockedBy] = useState(task.blockedBy ?? "")
  const [saving, setSaving]     = useState(false)
  const [hovering, setHovering] = useState(false)

  const done    = task.status === "DONE"
  const blocked = task.status === "BLOCKED"
  const cat     = CAT_META[task.category] ?? { label:task.category, color:"#6B7280", bg:"#F9FAFB" }
  const next    = (s: string) => s === "PENDING" ? "IN_PROGRESS" : s === "IN_PROGRESS" ? "DONE" : "PENDING"

  const saveEdit = async () => {
    if (!text.trim()) return
    setSaving(true)
    const res = await fetch(`/api/tasks/${task.id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ text, category, priority, blockedBy: blockedBy || null })
    })
    if (res.ok) {
      onUpdate(task.id, { text, category, priority, blockedBy: blockedBy || null })
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return
    const res = await fetch(`/api/tasks/${task.id}`, { method:"DELETE" })
    if (res.ok) onDelete(task.id)
  }

  // Edit mode
  if (editing) {
    return (
      <div style={{padding:"14px 20px",borderBottom:"1px solid #F9F8FF",background:"#FAFAFE"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <input value={text} onChange={e=>setText(e.target.value)}
            style={{...inp,fontSize:"13.5px",fontWeight:450}}
            onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditing(false)}}
            autoFocus />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={sel}>
                {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Priority</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)} style={sel}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Blocked by</label>
              <input value={blockedBy} onChange={e=>setBlockedBy(e.target.value)}
                placeholder="e.g. ITS DBA" style={inp}
                onFocus={e=>e.target.style.borderColor="#7C3AED"}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={saveEdit} disabled={saving||!text.trim()} style={{
              padding:"7px 16px",borderRadius:"8px",border:"none",
              background:"linear-gradient(135deg,#7C3AED,#9F67FA)",
              color:"white",fontSize:"13px",fontWeight:600,cursor:"pointer",
              opacity:saving||!text.trim()?0.5:1
            }}>{saving?"Saving…":"Save"}</button>
            <button onClick={()=>{setEditing(false);setText(task.text);setCategory(task.category);setPriority(task.priority);setBlockedBy(task.blockedBy??"")}} style={{
              padding:"7px 14px",borderRadius:"8px",border:"1.5px solid #E5E7EB",
              background:"white",color:"#6B7280",fontSize:"13px",cursor:"pointer"
            }}>Cancel</button>
            <button onClick={handleDelete} style={{
              marginLeft:"auto",padding:"7px 14px",borderRadius:"8px",
              border:"1.5px solid #FECACA",background:"#FEF2F2",
              color:"#DC2626",fontSize:"13px",cursor:"pointer"
            }}>Delete</button>
          </div>
        </div>
      </div>
    )
  }

  // View mode
  return (
    <div
      style={{display:"flex",alignItems:"flex-start",gap:"14px",padding:"13px 20px",borderBottom:"1px solid #F9F8FF",background:done?"#FAFAFE":blocked?"#FFF9F9":"white",transition:"background 0.1s"}}
      onMouseOver={()=>setHovering(true)}
      onMouseOut={()=>setHovering(false)}>
      <StatusButton status={task.status} onClick={()=>onToggle(task.id,next(task.status))} />
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setEditing(true)}>
        <p style={{fontSize:"13.5px",lineHeight:"1.55",margin:0,color:done?"#9CA3AF":"#1A1830",textDecoration:done?"line-through":"none",fontWeight:done?400:450}}>
          {task.text}
        </p>
        {task.blockedBy && (
          <span style={{display:"inline-flex",alignItems:"center",gap:"4px",fontSize:"11.5px",background:"#FEF2F2",color:"#DC2626",padding:"2px 8px",borderRadius:"20px",border:"1px solid #FECACA",fontWeight:500,marginTop:"5px"}}>
            ⚠ Blocked by: {task.blockedBy}
          </span>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
        {hovering && (
          <button onClick={()=>setEditing(true)} style={{
            background:"none",border:"1.5px solid #E5E7EB",borderRadius:"6px",
            padding:"3px 8px",cursor:"pointer",color:"#9CA3AF",fontSize:"11px",
            transition:"all 0.15s"
          }}
          onMouseOver={e=>{e.currentTarget.style.borderColor="#7C3AED";e.currentTarget.style.color="#7C3AED"}}
          onMouseOut={e =>{e.currentTarget.style.borderColor="#E5E7EB"; e.currentTarget.style.color="#9CA3AF"}}>
            Edit
          </button>
        )}
        {task.priority==="CRITICAL" && <span style={{fontSize:"10.5px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"}}>Critical</span>}
        {task.priority==="HIGH"     && <span style={{fontSize:"10.5px",fontWeight:600,padding:"2px 8px",borderRadius:"20px",background:"#FFFBEB",color:"#D97706",border:"1px solid #FDE68A"}}>High</span>}
        <span style={{fontSize:"11px",fontWeight:600,padding:"3px 9px",borderRadius:"20px",background:cat.bg,color:cat.color,border:`1px solid ${cat.color}25`}}>{cat.label}</span>
      </div>
    </div>
  )
}


// ── Add task inline form ──────────────────────────────────────────────────────
function AddTaskForm({ milestoneId, phaseColor, onAdd, onCancel }: {
  milestoneId: string; phaseColor: string
  onAdd: (t: Task) => void; onCancel: () => void
}) {
  const [text, setText]         = useState("")
  const [category, setCategory] = useState("DEV")
  const [priority, setPriority] = useState("MEDIUM")
  const [blockedBy, setBlockedBy] = useState("")
  const [loading, setLoading]   = useState(false)
  const [expanded, setExpanded] = useState(false)
  const ref                     = useRef<HTMLInputElement>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const res = await fetch("/api/tasks", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ milestoneId, text, category, priority, blockedBy: blockedBy || undefined })
    })
    if (res.ok) {
      onAdd(await res.json())
      setText(""); setBlockedBy(""); setExpanded(false)
      ref.current?.focus()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} style={{padding:"12px 20px",borderTop:"1px solid #F3F4F6",background:"#FAFAFE"}}>
      <div style={{display:"flex",gap:"8px",marginBottom:expanded?"10px":"0"}}>
        <div style={{width:22,height:22,borderRadius:"50%",border:"2px dashed #D1D5DB",flexShrink:0,marginTop:"9px"}} />
        <input ref={ref} value={text} onChange={e=>setText(e.target.value)}
          placeholder="Add a task… (press Enter to save)"
          style={{...inp,flex:1}}
          onFocus={e=>{e.target.style.borderColor=phaseColor;setExpanded(true)}}
          onBlur={e=>{if(!text)e.target.style.borderColor="#E5E7EB"}}
          autoFocus />
        {!expanded && <button type="button" onClick={onCancel} style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:"20px",padding:"0 4px",lineHeight:1}}>×</button>}
      </div>
      {expanded && (
        <div style={{marginLeft:"30px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"10px"}}>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Category</label>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={sel}>
                {CATEGORIES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Priority</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)} style={sel}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#9CA3AF",marginBottom:"4px",textTransform:"uppercase",letterSpacing:".05em"}}>Blocked by</label>
              <input value={blockedBy} onChange={e=>setBlockedBy(e.target.value)} placeholder="e.g. ITS DBA" style={inp}
                onFocus={e=>e.target.style.borderColor=phaseColor}
                onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button type="submit" disabled={loading||!text.trim()} style={{
              padding:"8px 18px",borderRadius:"8px",border:"none",
              background:"linear-gradient(135deg,#7C3AED,#9F67FA)",
              color:"white",fontSize:"13px",fontWeight:600,cursor:"pointer",
              opacity:loading||!text.trim()?0.5:1,boxShadow:"0 2px 8px rgba(124,58,237,0.3)"
            }}>{loading?"Saving…":"Add task"}</button>
            <button type="button" onClick={onCancel} style={{padding:"8px 14px",borderRadius:"8px",border:"1.5px solid #E5E7EB",background:"white",color:"#6B7280",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      )}
    </form>
  )
}

// ── Add milestone form ────────────────────────────────────────────────────────
function AddMilestoneForm({ phaseId, phaseColor, onAdd, onCancel }: {
  phaseId: string; phaseColor: string
  onAdd: (m: Milestone) => void; onCancel: () => void
}) {
  const [name, setName]   = useState("")
  const [theme, setTheme] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch("/api/milestones", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ phaseId, name, theme: theme || undefined })
    })
    if (res.ok) onAdd(await res.json())
    setLoading(false)
  }

  return (
    <div style={{background:"#F9F8FF",border:"1px dashed #DDD6FE",borderRadius:"12px",padding:"16px",marginBottom:"10px"}}>
      <p style={{fontSize:"12.5px",fontWeight:600,color:"#7C3AED",margin:"0 0 12px"}}>New milestone</p>
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Milestone name e.g. Week 1 · 3–7 Jun" style={inp} autoFocus
          onFocus={e=>e.target.style.borderColor=phaseColor}
          onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
        <input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="Theme (optional) e.g. Project setup & dependencies" style={inp}
          onFocus={e=>e.target.style.borderColor=phaseColor}
          onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
        <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
          <button type="submit" disabled={loading||!name.trim()} style={{
            padding:"8px 16px",borderRadius:"8px",border:"none",
            background:"linear-gradient(135deg,#7C3AED,#9F67FA)",
            color:"white",fontSize:"13px",fontWeight:600,cursor:"pointer",
            opacity:loading||!name.trim()?0.5:1
          }}>{loading?"Creating…":"Add milestone"}</button>
          <button type="button" onClick={onCancel} style={{padding:"8px 14px",borderRadius:"8px",border:"1.5px solid #E5E7EB",background:"white",color:"#6B7280",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// ── Add phase form ────────────────────────────────────────────────────────────
function AddPhaseForm({ projectId, onAdd, onCancel }: {
  projectId: string
  onAdd: (p: Phase) => void; onCancel: () => void
}) {
  const [name, setName]       = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [color, setColor]     = useState("#7C3AED")
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await fetch("/api/phases", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ projectId, name, subtitle: subtitle || undefined, color })
    })
    if (res.ok) onAdd(await res.json())
    setLoading(false)
  }

  return (
    <div style={{background:"#F9F8FF",border:"2px dashed #DDD6FE",borderRadius:"16px",padding:"24px"}}>
      <p style={{fontSize:"13px",fontWeight:600,color:"#7C3AED",margin:"0 0 16px"}}>Add a phase to get started</p>
      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <div>
          <label style={{display:"block",fontSize:"11.5px",fontWeight:600,color:"#9CA3AF",marginBottom:"5px"}}>Phase name *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. June 2026" style={inp} autoFocus
            onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
        </div>
        <div>
          <label style={{display:"block",fontSize:"11.5px",fontWeight:600,color:"#9CA3AF",marginBottom:"5px"}}>Subtitle</label>
          <input value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="e.g. Foundation" style={inp}
            onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor="#E5E7EB"} />
        </div>
        <div>
          <label style={{display:"block",fontSize:"11.5px",fontWeight:600,color:"#9CA3AF",marginBottom:"8px"}}>Colour</label>
          <div style={{display:"flex",gap:"8px"}}>
            {PHASE_COLORS.map(c=>(
              <button key={c} type="button" onClick={()=>setColor(c)} style={{
                width:26,height:26,borderRadius:"50%",background:c,border:`3px solid ${color===c?"#1A1830":"transparent"}`,cursor:"pointer",transition:"all 0.15s",outline:"none"
              }} />
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
          <button type="submit" disabled={loading||!name.trim()} style={{
            padding:"9px 20px",borderRadius:"8px",border:"none",
            background:"linear-gradient(135deg,#7C3AED,#9F67FA)",
            color:"white",fontSize:"13px",fontWeight:600,cursor:"pointer",
            opacity:loading||!name.trim()?0.5:1,boxShadow:"0 2px 8px rgba(124,58,237,0.3)"
          }}>{loading?"Creating…":"Create phase"}</button>
          <button type="button" onClick={onCancel} style={{padding:"9px 14px",borderRadius:"8px",border:"1.5px solid #E5E7EB",background:"white",color:"#6B7280",fontSize:"13px",cursor:"pointer"}}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// ── Milestone block ───────────────────────────────────────────────────────────
function MilestoneBlock({ milestone, phaseColor, onToggle, onTaskAdded, onTaskUpdated, onTaskDeleted }: {
  milestone: Milestone; phaseColor: string
  onToggle: (id: string, s: string) => void
  onTaskAdded: (milestoneId: string, task: Task) => void
  onTaskUpdated:  (milestoneId: string, taskId: string, updates: Partial<Task>) => void
  onTaskDeleted:  (milestoneId: string, taskId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [addingTask, setAddingTask] = useState(false)
  const done    = milestone.tasks.filter(t=>t.status==="DONE").length
  const blocked = milestone.tasks.filter(t=>t.status==="BLOCKED").length
  const total   = milestone.tasks.length
  const pct     = computeProgress(done, total)

  return (
    <div style={{background:"white",border:"1px solid #EDE8FF",borderLeft:`3px solid ${pct===100?"#059669":phaseColor}`,borderRadius:"12px",overflow:"hidden",marginBottom:"10px",boxShadow:"0 1px 4px rgba(124,58,237,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"13px 18px",background:"#FAFAFE",borderBottom:"1px solid #F3F4F6"}}>
        <button onClick={()=>setCollapsed(c=>!c)} style={{background:"none",border:"none",cursor:"pointer",padding:0,lineHeight:0,flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{transition:"transform 0.2s",transform:collapsed?"rotate(-90deg)":"rotate(0deg)"}}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setCollapsed(c=>!c)}>
          <span style={{fontSize:"13.5px",fontWeight:600,color:"#1A1830"}}>{milestone.name}</span>
          {milestone.theme && <span style={{fontSize:"12px",color:"#9CA3AF",marginLeft:"8px"}}>{milestone.theme}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
          {blocked > 0 && <span style={{fontSize:"11px",color:"#DC2626",background:"#FEF2F2",padding:"2px 8px",borderRadius:"20px",border:"1px solid #FECACA"}}>{blocked} blocked</span>}
          {pct === 100 && <span style={{fontSize:"11px",color:"#059669",background:"#F0FDF4",padding:"2px 8px",borderRadius:"20px",border:"1px solid #BBF7D0",fontWeight:600}}>✓ Done</span>}
          <div style={{width:"72px",height:"5px",borderRadius:"3px",background:"#F3F4F6"}}>
            <div style={{height:"5px",borderRadius:"3px",background:pct===100?"#059669":phaseColor,width:`${pct}%`,transition:"width 0.3s"}} />
          </div>
          <span style={{fontSize:"12px",color:"#9CA3AF",minWidth:"36px",textAlign:"right"}}>{done}/{total}</span>
        </div>
      </div>

      {!collapsed && (
        <>
          {milestone.tasks.length === 0 && !addingTask ? (
            <div style={{padding:"20px",textAlign:"center",color:"#9CA3AF",fontSize:"13px"}}>
              No tasks yet.{" "}
              <button onClick={()=>setAddingTask(true)} style={{color:"#7C3AED",background:"none",border:"none",cursor:"pointer",fontSize:"13px",fontWeight:500,textDecoration:"underline"}}>Add one</button>
            </div>
          ) : milestone.tasks.map(t => <TaskRow
    key={t.id}
    task={t}
    onToggle={onToggle}
    onUpdate={(taskId, updates) => onTaskUpdated(milestone.id, taskId, updates)}
    onDelete={(taskId) => onTaskDeleted(milestone.id, taskId)}
  />)}

          {addingTask ? (
            <AddTaskForm milestoneId={milestone.id} phaseColor={phaseColor}
              onAdd={t=>{onTaskAdded(milestone.id,t);setAddingTask(false)}}
              onCancel={()=>setAddingTask(false)} />
          ) : (
            <button onClick={()=>setAddingTask(true)} style={{
              width:"100%",padding:"10px 20px",background:"none",border:"none",
              borderTop:"1px solid #F3F4F6",display:"flex",alignItems:"center",gap:"8px",
              color:"#9CA3AF",fontSize:"13px",cursor:"pointer",transition:"all 0.15s",textAlign:"left"
            }}
            onMouseOver={e=>{e.currentTarget.style.background="#F9F8FF";e.currentTarget.style.color="#7C3AED"}}
            onMouseOut={e =>{e.currentTarget.style.background="none";   e.currentTarget.style.color="#9CA3AF"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add task
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ProjectView({ phases, projectId }: { phases: Phase[]; projectId: string }) {
  const [localPhases, setLocalPhases]     = useState(phases)
  const [activePhase, setActivePhase]     = useState(phases[0]?.id ?? "")
  const [filter, setFilter]               = useState("ALL")
  const [addingPhase, setAddingPhase]     = useState(false)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [, startTransition]               = useTransition()

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

const addTask = (milestoneId: string, task: Task) => {
  setLocalPhases(prev => prev.map(ph => ({
    ...ph,
    milestones: ph.milestones.map(m => m.id === milestoneId ? { ...m, tasks:[...m.tasks,task] } : m)
  })))
}

const updateTask = (milestoneId: string, taskId: string, updates: Partial<Task>) => {
  setLocalPhases(prev => prev.map(ph => ({
    ...ph,
    milestones: ph.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, tasks: m.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t) }
        : m
    )
  })))
}

const deleteTask = (milestoneId: string, taskId: string) => {
  setLocalPhases(prev => prev.map(ph => ({
    ...ph,
    milestones: ph.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) }
        : m
    )
  })))
}

  const addPhase = (phase: Phase) => {
    setLocalPhases(prev => [...prev, phase])
    setActivePhase(phase.id)
    setAddingPhase(false)
  }

  const addMilestone = (milestone: Milestone) => {
    setLocalPhases(prev => prev.map(ph =>
      ph.id === activePhase ? { ...ph, milestones:[...ph.milestones, milestone] } : ph
    ))
    setAddingMilestone(false)
  }

  // ── Empty state: no phases ────────────────────────────────────────────────
  if (localPhases.length === 0 && !addingPhase) {
    return (
      <div style={{textAlign:"center",padding:"48px 24px",background:"white",borderRadius:"16px",border:"1px solid #EDE8FF"}}>
        <div style={{width:56,height:56,borderRadius:"16px",background:"#F5F3FF",border:"1px solid #DDD6FE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <h3 style={{fontSize:"15px",fontWeight:600,color:"#1A1830",margin:"0 0 8px"}}>No phases yet</h3>
        <p style={{fontSize:"13.5px",color:"#9CA3AF",margin:"0 0 20px",lineHeight:1.6}}>
          Phases break your project into chunks — like months, sprints, or stages.<br/>
          Add your first phase to start creating milestones and tasks.
        </p>
        <button onClick={()=>setAddingPhase(true)} style={{
          display:"inline-flex",alignItems:"center",gap:"8px",
          padding:"10px 20px",borderRadius:"10px",border:"none",
          background:"linear-gradient(135deg,#7C3AED,#9F67FA)",
          color:"white",fontSize:"13.5px",fontWeight:600,cursor:"pointer",
          boxShadow:"0 4px 14px rgba(124,58,237,0.35)"
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add first phase
        </button>
      </div>
    )
  }

  if (addingPhase && localPhases.length === 0) {
    return <AddPhaseForm projectId={projectId} onAdd={addPhase} onCancel={()=>setAddingPhase(false)} />
  }

  const current   = localPhases.find(p => p.id === activePhase) ?? localPhases[0]
  if (!current) return null

  const allTasks  = current.milestones.flatMap(m => m.tasks)
  const phaseDone = allTasks.filter(t => t.status === "DONE").length
  const blocked   = allTasks.filter(t => t.status === "BLOCKED").length

  const filtered = current.milestones.map(m => ({
    ...m,
    tasks: filter === "ALL" ? m.tasks : m.tasks.filter(t => t.status === filter)
  })).filter(m => filter === "ALL" || m.tasks.length > 0)

  const FILTERS = [
    { key:"ALL",         label:"All",         count:allTasks.length },
    { key:"PENDING",     label:"Pending",     count:allTasks.filter(t=>t.status==="PENDING").length },
    { key:"IN_PROGRESS", label:"In Progress", count:allTasks.filter(t=>t.status==="IN_PROGRESS").length },
    { key:"BLOCKED",     label:"Blocked",     count:allTasks.filter(t=>t.status==="BLOCKED").length },
    { key:"DONE",        label:"Done",        count:allTasks.filter(t=>t.status==="DONE").length },
  ]

  return (
    <div>
      {/* Phase tabs + add phase button */}
      <div style={{display:"flex",gap:"8px",marginBottom:"20px",alignItems:"stretch",flexWrap:"wrap"}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${localPhases.length},1fr)`,gap:"8px",flex:1}}>
          {localPhases.map(phase => {
            const tasks  = phase.milestones.flatMap(m => m.tasks)
            const d      = tasks.filter(t=>t.status==="DONE").length
            const pct    = computeProgress(d,tasks.length)
            const active = phase.id === activePhase
            return (
              <button key={phase.id} onClick={()=>setActivePhase(phase.id)} style={{
                padding:"14px 16px",borderRadius:"12px",textAlign:"left",
                border:`2px solid ${active?phase.color:"#E5E7EB"}`,
                background:active?phase.color+"0E":"white",
                cursor:"pointer",transition:"all 0.15s",
                boxShadow:active?`0 2px 12px ${phase.color}20`:"0 1px 3px rgba(0,0,0,0.04)"
              }}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"4px"}}>
                  <div style={{fontSize:"13.5px",fontWeight:700,color:active?phase.color:"#374151"}}>{phase.name}</div>
                  <div style={{fontSize:"12px",fontWeight:600,color:pct===100?"#059669":active?phase.color:"#9CA3AF"}}>{pct}%</div>
                </div>
                <div style={{fontSize:"11.5px",color:"#9CA3AF",marginBottom:"10px"}}>{phase.subtitle} · {d}/{tasks.length} done</div>
                <div style={{height:"5px",borderRadius:"3px",background:"#F3F4F6"}}>
                  <div style={{height:"5px",borderRadius:"3px",background:pct===100?"#059669":phase.color,width:`${pct}%`,transition:"width 0.3s"}} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Add phase button */}
        {addingPhase ? (
          <div style={{flex:"0 0 100%",marginTop:"8px"}}>
            <AddPhaseForm projectId={projectId} onAdd={addPhase} onCancel={()=>setAddingPhase(false)} />
          </div>
        ) : (
          <button onClick={()=>setAddingPhase(true)} style={{
            padding:"14px 16px",borderRadius:"12px",border:"2px dashed #DDD6FE",
            background:"white",cursor:"pointer",color:"#9CA3AF",fontSize:"13px",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"4px",
            minWidth:"80px",transition:"all 0.15s"
          }}
          onMouseOver={e=>{e.currentTarget.style.borderColor="#7C3AED";e.currentTarget.style.color="#7C3AED";e.currentTarget.style.background="#F9F8FF"}}
          onMouseOut={e =>{e.currentTarget.style.borderColor="#DDD6FE";e.currentTarget.style.color="#9CA3AF";e.currentTarget.style.background="white"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span style={{fontSize:"11px",fontWeight:500}}>Phase</span>
          </button>
        )}
      </div>

      {/* Filter + stats */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"13.5px",color:"#1A1830",fontWeight:600}}>{phaseDone} of {allTasks.length} done</span>
          {blocked > 0 && <span style={{fontSize:"12px",color:"#DC2626",background:"#FEF2F2",padding:"3px 10px",borderRadius:"20px",border:"1px solid #FECACA",fontWeight:500}}>⚠ {blocked} blocked</span>}
        </div>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
          {FILTERS.map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              fontSize:"12px",padding:"5px 12px",borderRadius:"8px",cursor:"pointer",
              border:filter===f.key?"1.5px solid #7C3AED":"1.5px solid #E5E7EB",
              background:filter===f.key?"#F5F3FF":"white",
              color:filter===f.key?"#7C3AED":"#6B7280",
              fontWeight:filter===f.key?600:400,transition:"all 0.15s",
              display:"flex",alignItems:"center",gap:"5px"
            }}>
              {f.label}
              <span style={{fontSize:"10.5px",padding:"0px 5px",borderRadius:"10px",background:filter===f.key?"#DDD6FE":"#F3F4F6",color:filter===f.key?"#7C3AED":"#9CA3AF",fontWeight:600}}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add milestone form */}
      {addingMilestone && (
        <AddMilestoneForm phaseId={current.id} phaseColor={current.color}
          onAdd={addMilestone} onCancel={()=>setAddingMilestone(false)} />
      )}

      {/* Milestones */}
      {filtered.length === 0 && !addingMilestone ? (
        <div style={{textAlign:"center",padding:"40px",color:"#9CA3AF",fontSize:"13.5px",background:"white",borderRadius:"12px",border:"1px solid #EDE8FF"}}>
          {filter !== "ALL" ? "No tasks match this filter" : "No milestones yet. Add one below."}
        </div>
      ) : filtered.map(m => (
  <MilestoneBlock
    key={m.id}
    milestone={m}
    phaseColor={current.color}
    onToggle={toggle}
    onTaskAdded={addTask}
    onTaskUpdated={(milestoneId, taskId, updates) => updateTask(milestoneId, taskId, updates)}
    onTaskDeleted={(milestoneId, taskId) => deleteTask(milestoneId, taskId)}
  />
))}

      {/* Add milestone button */}
      {!addingMilestone && (
        <button onClick={()=>setAddingMilestone(true)} style={{
          width:"100%",marginTop:"8px",padding:"11px",borderRadius:"10px",
          border:"2px dashed #DDD6FE",background:"white",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
          color:"#9CA3AF",fontSize:"13px",fontWeight:500,transition:"all 0.15s"
        }}
        onMouseOver={e=>{e.currentTarget.style.borderColor="#7C3AED";e.currentTarget.style.color="#7C3AED";e.currentTarget.style.background="#F9F8FF"}}
        onMouseOut={e =>{e.currentTarget.style.borderColor="#DDD6FE";e.currentTarget.style.color="#9CA3AF";e.currentTarget.style.background="white"}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add milestone
        </button>
      )}
    </div>
  )
}
