// @ts-nocheck
import { PrismaClient, TaskCategory, TaskStatus, Priority, ProjectType } from "@prisma/client"

const prisma = new PrismaClient()

type SeedTask = {
  text: string
  cat?: string
  status?: string
  priority?: string
  blocked?: string
}

type SeedMilestone = {
  name: string
  theme: string
  order: number
  tasks: SeedTask[]
}

async function main() {
  console.log("🌱 Seeding dev-project-manager...")

  const users = await prisma.user.findMany({ take: 1 })
  if (users.length === 0) {
    console.log("⚠️  No users found. Sign in first, then re-run the seed.")
    return
  }
  const user = users[0]
  console.log(`✅ Seeding for user: ${user.email}`)

  await prisma.project.deleteMany({ where: { userId: user.id, name: "CUT ICT Dashboard" } })

  const project = await prisma.project.create({
    data: {
      userId:      user.id,
      name:        "CUT ICT Dashboard",
      description: "Power BI ICT Services Dashboard — June to August 2026. Sources: ITS Oracle, ManageEngine SDP, Celoxis.",
      type:        ProjectType.INSTITUTIONAL,
      color:       "#0EA5E9",
      stack:       ["FastAPI", "Power BI", "Oracle", "ManageEngine SDP", "Celoxis", "Docker"],
      client:      "CUT ICT",
      dueDate:     new Date("2026-08-31"),
    }
  })

  // ─── JUNE ────────────────────────────────────────────────────────────────
  const june = await prisma.phase.create({
    data: {
      projectId: project.id, name: "June 2026", subtitle: "Foundation",
      startDate: new Date("2026-06-03"), endDate: new Date("2026-06-28"),
      color: "#0EA5E9", order: 1
    }
  })

  const juneMilestones: SeedMilestone[] = [
    {
      name: "Week 1 · 3–7 Jun", theme: "Project setup & dependency kickoff", order: 1, tasks: [
        { text: "Create CUT ICT Dashboard - DEV workspace in Power BI Service", cat: "SETUP", status: "DONE", priority: "HIGH" },
        { text: "Install Power BI Desktop on Windows laptop", cat: "SETUP", status: "DONE" },
        { text: "Sign into Power BI Desktop, verify DEV workspace appears", cat: "SETUP" },
        { text: "Email ITS DBA: request read-only Oracle access (PS_LEDGER, PS_LEDGER_BUDG, PS_GL_ACCOUNT_TBL)", cat: "DEPS", priority: "CRITICAL", blocked: "ITS DBA" },
        { text: "Email SDP admin: create pbi-integration technician + API key", cat: "DEPS", priority: "HIGH", blocked: "SDP Admin" },
        { text: "Email Celoxis admin: confirm API base URL + credentials", cat: "DEPS", priority: "HIGH", blocked: "Celoxis Admin" },
        { text: "Email boss / infra team: SSH access to ETL server + Docker", cat: "DEPS", blocked: "Infra Team" },
        { text: "CC boss on all dependency emails", cat: "DEPS" },
        { text: "Create ICT_Budget_Staging.xlsx on SharePoint as Oracle fallback", cat: "FALLBACK" },
        { text: "Create GitHub repo: dev-project-manager (private)", cat: "SETUP", status: "DONE" },
      ]
    },
    {
      name: "Week 2 · 10–14 Jun", theme: "FastAPI scaffolding & local dev", order: 2, tasks: [
        { text: "Scaffold budget-api: FastAPI, Dockerfile, .env.example", cat: "DEV" },
        { text: "Scaffold incidents-api: FastAPI, Dockerfile, .env.example", cat: "DEV" },
        { text: "budget-api: GET /api/v1/budget/summary (Oracle GL query)", cat: "DEV", priority: "HIGH" },
        { text: "budget-api: GET /api/v1/budget/ytd", cat: "DEV" },
        { text: "budget-api: GET /api/v1/budget/allocation (donut chart data)", cat: "DEV" },
        { text: "budget-api: GET /api/v1/budget/trend (area chart series)", cat: "DEV" },
        { text: "budget-api: add 30-min lru_cache on all endpoints", cat: "DEV" },
        { text: "If Oracle delayed: wire budget-api to SharePoint Excel fallback", cat: "FALLBACK" },
        { text: "incidents-api: _fetch_sdp_requests() helper with v3 headers", cat: "DEV" },
        { text: "incidents-api: GET /api/v1/incidents/recent", cat: "DEV" },
        { text: "incidents-api: GET /api/v1/incidents/open (WoW % change)", cat: "DEV" },
        { text: "incidents-api: GET /api/v1/incidents/by-severity", cat: "DEV" },
        { text: "curl SDP /api/v3/requests/filters — get exact CUT filter names", cat: "DEV" },
      ]
    },
    {
      name: "Week 3 · 17–21 Jun", theme: "Celoxis API + local deployment", order: 3, tasks: [
        { text: "Test Celoxis GET /api/v2/projects — verify auth + field names", cat: "DEV" },
        { text: "Test Celoxis GET /api/v2/assignments — member count per project", cat: "DEV" },
        { text: "Build Power Query M connector for budget-api in Power BI Desktop", cat: "BUILD" },
        { text: "Build Power Query M connector for incidents-api", cat: "BUILD" },
        { text: "Build Power Query M connector for Celoxis", cat: "BUILD" },
        { text: "Deploy budget-api + incidents-api via Docker Compose (local)", cat: "DEPLOY" },
        { text: "Confirm all endpoints correct in Postman before connecting PBI", cat: "DEV" },
        { text: "Create DimDate table in Power Query (FY2024–FY2027)", cat: "SETUP" },
        { text: "Verify SharePoint Excel fallback loads in Power BI", cat: "FALLBACK" },
      ]
    },
    {
      name: "Week 4 · 24–28 Jun", theme: "Data model & DAX measures", order: 4, tasks: [
        { text: "Define all table relationships in Power BI model view", cat: "MODEL", priority: "HIGH" },
        { text: "DAX: IT Spend YTD = CALCULATE(SUM(Budget[Actual]), DATESYTD(DimDate[Date]))", cat: "MODEL" },
        { text: "DAX: YTD vs Budget % = DIVIDE([IT Spend YTD] - [Budget YTD], [Budget YTD], 0)", cat: "MODEL" },
        { text: "DAX: Open Incidents Count from incidents-api open_count", cat: "MODEL" },
        { text: "DAX: Active Projects Count = COUNTROWS(FILTER(Projects, status = \"Active\"))", cat: "MODEL" },
        { text: "DAX: Projects On Track + At Risk measures", cat: "MODEL" },
        { text: "DAX: Project Status Summary combined measure", cat: "MODEL" },
        { text: "DAX: Severity Color SWITCH measure for conditional formatting", cat: "MODEL" },
        { text: "JUNE EXIT: all data loads, relationships valid, measures correct", cat: "SETUP", priority: "CRITICAL" },
      ]
    },
  ]

  await seedMilestones(june.id, juneMilestones, null)

  // ─── JULY ─────────────────────────────────────────────────────────────────
  const july = await prisma.phase.create({
    data: {
      projectId: project.id, name: "July 2026", subtitle: "Build",
      startDate: new Date("2026-07-01"), endDate: new Date("2026-07-26"),
      color: "#8B5CF6", order: 2
    }
  })

  const julyMilestones: SeedMilestone[] = [
    {
      name: "Week 1 · 1–5 Jul", theme: "Overview page — KPIs & Budget table", order: 1, tasks: [
        { text: "Create Overview report page — canvas 1920×1080, background #0D1117", cat: "BUILD" },
        { text: "Build IT Spend YTD card visual with conditional colour formatting", cat: "BUILD" },
        { text: "Build Open Incidents card visual with WoW % change subtitle", cat: "BUILD" },
        { text: "Build System Uptime card — percentage + SLA subtitle", cat: "BUILD" },
        { text: "Build Active Projects card — count + On Track/At Risk subtitle", cat: "BUILD" },
        { text: "Build time period filter bar — Real-time / Today / Week / Month / Quarter / Year", cat: "BUILD" },
        { text: "Build Budget Management table — conditional formatting on Variance", cat: "BUILD" },
        { text: "Style Budget table: dark header, alternating rows, right-aligned currency", cat: "POLISH" },
        { text: "Pixel-align all KPI cards on consistent grid", cat: "POLISH" },
      ]
    },
    {
      name: "Week 2 · 8–12 Jul", theme: "Spending charts & Incidents panel", order: 2, tasks: [
        { text: "Build IT Spending Trend area chart — Actual + Budget series, teal/grey", cat: "BUILD" },
        { text: "Build IT Budget Allocation donut chart — 3 slices + Total Budget centre", cat: "BUILD" },
        { text: "Build Recent Incidents table — ID, Incident, Severity, Status, Time", cat: "BUILD" },
        { text: "Add severity badge conditional formatting (Critical/High/Medium/Low)", cat: "BUILD" },
        { text: "Add status icon conditional formatting (clock/tick/X)", cat: "BUILD" },
        { text: "Build System Health panel — uptime %, status dot, badge", cat: "BUILD" },
        { text: "Test all visuals with time period slicer", cat: "UAT" },
        { text: "Create Infrastructure report page — Spending Trend + System Health", cat: "BUILD" },
      ]
    },
    {
      name: "Week 3 · 15–19 Jul", theme: "Projects, Audits & Risk Register", order: 3, tasks: [
        { text: "Install Zebra BI Tables or Bullet Chart from AppSource", cat: "SETUP" },
        { text: "Build Active Projects progress bar panel", cat: "BUILD" },
        { text: "Colour-code progress bars: green ≥60%, amber 30–59%, red <30%", cat: "BUILD" },
        { text: "Build IT Audits table with status conditional formatting", cat: "BUILD" },
        { text: "Build Risk Register table with trend arrow formatting", cat: "BUILD" },
        { text: "Create Security page — Incidents + Risk Register", cat: "BUILD" },
        { text: "Create Projects page — Active Projects", cat: "BUILD" },
        { text: "Create Compliance page — IT Audits", cat: "BUILD" },
      ]
    },
    {
      name: "Week 4 · 22–26 Jul", theme: "Theme, navigation & polish", order: 4, tasks: [
        { text: "Create Power BI JSON theme file — #0D1117 background, teal accent #1D9E75", cat: "POLISH" },
        { text: "Apply theme across all report pages", cat: "POLISH" },
        { text: "Build left sidebar navigation — 8 page navigation buttons", cat: "POLISH" },
        { text: "Sync navigation across all pages (View → Sync Slicers)", cat: "POLISH" },
        { text: "Add CUT logo to report header", cat: "POLISH" },
        { text: "Pixel-perfect alignment pass — Format → Align to grid", cat: "POLISH" },
        { text: "JULY EXIT: all panels built, live data loads, navigation works. Show boss.", cat: "SETUP", priority: "CRITICAL" },
      ]
    },
  ]

  await seedMilestones(july.id, julyMilestones, null)

  // ─── AUGUST ───────────────────────────────────────────────────────────────
  const august = await prisma.phase.create({
    data: {
      projectId: project.id, name: "August 2026", subtitle: "Publish & Handover",
      startDate: new Date("2026-07-29"), endDate: new Date("2026-08-23"),
      color: "#10B981", order: 3
    }
  })

  const augustMilestones: SeedMilestone[] = [
    {
      name: "Week 1 · 29 Jul–2 Aug", theme: "Publish to Service & security", order: 1, tasks: [
        { text: "Create CUT ICT Dashboard - PROD workspace", cat: "DEPLOY" },
        { text: "Publish report to DEV workspace, verify in browser", cat: "DEPLOY" },
        { text: "Configure Row-Level Security: ICT_Manager + ICT_Staff roles", cat: "DEPLOY", priority: "HIGH" },
        { text: "Map Azure AD groups to RLS roles", cat: "DEPLOY" },
        { text: "Set up scheduled refresh: budget/projects daily 06:00, incidents every 30 min", cat: "DEPLOY" },
        { text: "Deploy APIs to ETL server via Docker Compose if ready", cat: "DEPLOY" },
        { text: "Test scheduled refresh runs without credential errors", cat: "UAT" },
      ]
    },
    {
      name: "Week 2 · 5–9 Aug", theme: "Teams embed & UAT", order: 2, tasks: [
        { text: "Embed in Microsoft Teams ICT channel", cat: "DEPLOY" },
        { text: "Test Teams embed — pages, filters, RLS per role", cat: "UAT" },
        { text: "Schedule UAT session — boss + 2 ICT managers", cat: "MEETING" },
        { text: "Run UAT session — log Critical / Nice-to-have / V2 backlog", cat: "UAT" },
        { text: "Fix all Critical UAT issues", cat: "UAT", priority: "CRITICAL" },
        { text: "Log Nice-to-have and V2 items in GitHub Issues only", cat: "DOCS" },
        { text: "Get written sign-off from boss before PROD promotion", cat: "HANDOVER", priority: "HIGH" },
      ]
    },
    {
      name: "Week 3 · 12–16 Aug", theme: "Production & documentation", order: 3, tasks: [
        { text: "Promote report from DEV to PROD workspace", cat: "DEPLOY" },
        { text: "Update Teams embed to point at PROD", cat: "DEPLOY" },
        { text: "Handover doc section 1: architecture overview", cat: "DOCS" },
        { text: "Handover doc section 2: credential rotation guide", cat: "DOCS" },
        { text: "Handover doc section 3: how to add a new report page", cat: "DOCS" },
        { text: "Handover doc section 4: NiFi/warehouse migration plan", cat: "DOCS" },
        { text: "Handover doc section 5: v2 backlog", cat: "DOCS" },
        { text: "Record 10-min Loom/Teams walkthrough for stakeholders", cat: "DOCS" },
        { text: "Submit data requirements to Registrar ETL project lead", cat: "HANDOVER", priority: "CRITICAL" },
      ]
    },
    {
      name: "Week 4 · 19–23 Aug", theme: "Buffer, enhancements & BRM sign-off", order: 4, tasks: [
        { text: "Buffer — address late UAT feedback and documentation issues", cat: "BUFFER" },
        { text: "BONUS: configure Streaming Dataset for real-time incident KPI tile", cat: "ENHANCE" },
        { text: "BONUS: assign Copilot seats to ICT managers, enable Q&A", cat: "ENHANCE" },
        { text: "BONUS: SharePoint intranet embed", cat: "ENHANCE" },
        { text: "Prepare BRM sign-off presentation (10 slides)", cat: "HANDOVER" },
        { text: "Present to BRM team — get formal project sign-off", cat: "HANDOVER", priority: "CRITICAL" },
        { text: "FINAL CHECK: refresh overnight, Teams live, RLS tested, handover in SharePoint", cat: "HANDOVER", priority: "CRITICAL" },
      ]
    },
  ]

  await seedMilestones(august.id, augustMilestones, null)

  const total = [juneMilestones, julyMilestones, augustMilestones]
    .flat()
    .reduce((s, m) => s + m.tasks.length, 0)

  console.log(`✅ Seeded: ${project.name}`)
  console.log(`   3 phases · 12 milestones · ${total} tasks`)
}

async function seedMilestones(phaseId: string, milestones: SeedMilestone[], _unused: null) {
  for (const ms of milestones) {
    const milestone = await prisma.milestone.create({
      data: { phaseId, name: ms.name, theme: ms.theme, order: ms.order }
    })
    for (let i = 0; i < ms.tasks.length; i++) {
      const t = ms.tasks[i]
      await prisma.task.create({
        data: {
          milestoneId: milestone.id,
          text:        t.text,
          category:    (t.cat ?? "SETUP") as TaskCategory,
          status:      (t.status ?? "PENDING") as TaskStatus,
          priority:    (t.priority ?? "MEDIUM") as Priority,
          blockedBy:   t.blocked ?? null,
          order:       i + 1,
        }
      })
    }
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())