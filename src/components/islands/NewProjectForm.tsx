import { useState } from "react"

const COLORS = ["#7C3AED","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#F97316"]

const TYPES = [
  { value: "INSTITUTIONAL", label: "Institutional", icon: "🏛️" },
  { value: "SAAS_PRODUCT",  label: "SaaS Product",  icon: "🚀" },
  { value: "CLIENT",        label: "Client",        icon: "🤝" },
  { value: "RESEARCH",      label: "Research",      icon: "🔬" },
  { value: "PERSONAL",      label: "Personal",      icon: "👤" },
]

const inp: React.CSSProperties = {
  width:"100%", padding:"10px 14px", fontSize:"14px",
  background:"#FAFAFA", border:"1.5px solid #E5E7EB",
  borderRadius:"8px", color:"#1A1830", outline:"none",
  fontFamily:"inherit", transition:"border-color 0.2s"
}

export function NewProjectForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [form, setForm]       = useState({
    name:"", description:"", type:"INSTITUTIONAL",
    color:"#7C3AED", stack:"", client:"", dueDate:""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true); setError("")
    const res = await fetch("/api/projects", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        ...form,
        stack:   form.stack.split(",").map(s=>s.trim()).filter(Boolean),
        dueDate: form.dueDate || undefined,
      })
    })
    if (res.ok) { const p = await res.json(); window.location.href = `/projects/${p.id}` }
    else { setError("Failed to create project"); setLoading(false) }
  }

  return (
    <div style={{background:"white",border:"1px solid #EDE8FF",borderRadius:"16px",padding:"28px",boxShadow:"0 4px 24px rgba(124,58,237,0.08)"}}>
      <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"18px"}}>

        <div>
          <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Project name *</label>
          <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            style={inp} placeholder="CUT ICT Dashboard"
            onFocus={e=>{e.target.style.borderColor="#7C3AED";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"}}
            onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Description</label>
          <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
            style={{...inp,resize:"none"}} placeholder="What is this project?"
            onFocus={e=>{e.target.style.borderColor="#7C3AED";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"}}
            onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none"}} />
        </div>

        <div>
          <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"8px"}}>Type</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
            {TYPES.map(t=>(
              <button key={t.value} type="button" onClick={()=>setForm(f=>({...f,type:t.value}))}
                style={{padding:"10px",borderRadius:"8px",border:`1.5px solid ${form.type===t.value?"#7C3AED":"#E5E7EB"}`,background:form.type===t.value?"#F5F3FF":"white",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{fontSize:"16px",marginBottom:"3px"}}>{t.icon}</div>
                <div style={{fontSize:"12px",fontWeight:500,color:form.type===t.value?"#7C3AED":"#374151"}}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"8px"}}>Colour</label>
          <div style={{display:"flex",gap:"8px"}}>
            {COLORS.map(c=>(
              <button key={c} type="button" onClick={()=>setForm(f=>({...f,color:c}))}
                style={{width:"28px",height:"28px",borderRadius:"50%",background:c,border:`3px solid ${form.color===c?"#1A1830":"transparent"}`,cursor:"pointer",transition:"all 0.15s",outline:"none"}} />
            ))}
          </div>
        </div>

        <div>
          <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Tech stack <span style={{color:"#9CA3AF",fontWeight:400}}>(comma separated)</span></label>
          <input value={form.stack} onChange={e=>setForm(f=>({...f,stack:e.target.value}))}
            style={inp} placeholder="FastAPI, Next.js, Neon, Power BI"
            onFocus={e=>{e.target.style.borderColor="#7C3AED";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"}}
            onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none"}} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          <div>
            <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Client / Institution</label>
            <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))}
              style={inp} placeholder="CUT ICT"
              onFocus={e=>{e.target.style.borderColor="#7C3AED";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"}}
              onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none"}} />
          </div>
          <div>
            <label style={{display:"block",fontSize:"12.5px",fontWeight:500,color:"#374151",marginBottom:"6px"}}>Due date</label>
            <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}
              style={{...inp,colorScheme:"light"}}
              onFocus={e=>{e.target.style.borderColor="#7C3AED";e.target.style.boxShadow="0 0 0 3px rgba(124,58,237,0.1)"}}
              onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none"}} />
          </div>
        </div>

        {error && <p style={{fontSize:"13px",color:"#DC2626"}}>{error}</p>}

        <div style={{display:"flex",gap:"10px",paddingTop:"4px"}}>
          <button type="button" onClick={()=>window.history.back()}
            style={{flex:1,padding:"11px",borderRadius:"10px",border:"1.5px solid #E5E7EB",background:"white",fontSize:"14px",fontWeight:500,color:"#374151",cursor:"pointer",transition:"all 0.15s"}}>
            Cancel
          </button>
          <button type="submit" disabled={loading||!form.name.trim()}
            style={{flex:1,padding:"11px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#7C3AED,#9F67FA)",fontSize:"14px",fontWeight:600,color:"white",cursor:loading?"not-allowed":"pointer",opacity:loading||!form.name.trim()?0.6:1,boxShadow:"0 4px 14px rgba(124,58,237,0.35)",transition:"all 0.2s"}}>
            {loading ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>
    </div>
  )
}
