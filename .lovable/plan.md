# AI Workplace Productivity Assistant

A clean, light-themed SaaS dashboard with three AI-powered tools. No auth, no database — outputs persist in browser localStorage for "Saved Outputs" and recent activity.

## Scope

**In:** Dashboard, Smart Email Generator, Meeting Notes Summarizer, AI Task Planner, Settings.
**Out:** AI Research Assistant, AI Chatbot (per your request).

## Stack & Backend

- TanStack Start + React + TypeScript, Tailwind v4, shadcn/ui (already installed).
- AI calls via Lovable AI Gateway (`google/gemini-3-flash-preview`) through a single `createServerFn` per tool. No user-managed API key needed — works out of the box.
- localStorage for: saved outputs, recent activity, theme, settings. No Lovable Cloud / database (keeps it instant; can be added later).

## Routes (file-based, under `src/routes/`)

```
__root.tsx              shell + sidebar + header + theme provider
index.tsx               Dashboard (stats + quick actions + recent activity)
email.tsx               Smart Email Generator
meetings.tsx            Meeting Notes Summarizer
tasks.tsx               AI Task Planner
saved.tsx               Saved Outputs (all tools)
settings.tsx            Theme, AI provider info, export data, clear data
api/email.ts            POST -> generateEmail server fn
api/meetings.ts         POST -> summarizeMeeting
api/tasks.ts            POST -> planTasks
```

## Layout

- **Left sidebar** (collapsible, shadcn Sidebar): logo, nav items with lucide icons, active-route highlight.
- **Top header**: page title, global search (filters saved outputs), theme toggle, mock user avatar with dropdown.
- **Main**: card-based content area, max-w container, responsive grid.

## Dashboard

- 4 stat cards (counters from localStorage): Emails Generated, Meetings Summarized, Tasks Planned, Total Outputs.
- Quick Action grid: Generate Email / Summarize Notes / Plan Tasks (links to tool routes).
- Recent Activity panel: last 10 actions across tools, click to reopen.

## Tool pages (shared pattern)

Each tool has: input form (left/top) + result panel (right/bottom) + responsible AI notice banner + loading skeleton + empty state + error toast.

**Smart Email Generator**
- Inputs: Recipient, Purpose (textarea), Tone (Formal / Friendly / Persuasive / Professional radio).
- Output: editable textarea with subject + body. Copy / Regenerate / Clear / Save buttons.

**Meeting Notes Summarizer**
- Input: notes textarea (large).
- Output: 5 editable sections rendered as cards — Executive Summary, Key Decisions, Action Items, Deadlines, Follow-up Tasks. Per-section copy + global regenerate/save.
- Server returns structured JSON via AI SDK `Output.object` (Zod schema).

**AI Task Planner**
- Input: free-text task list + optional working hours.
- Output: timeline view (per-day cards with time-blocked tasks), Priority badge, Time Estimate, Productivity Recommendations list. Editable, savable.
- Structured JSON output.

## Shared UI

- `<ResponsibleAINotice />` banner on every tool page.
- `<ToolHeader />`, `<ResultCard />`, `<CopyButton />`, `<EmptyState />`, `<LoadingShimmer />`.
- Toasts via existing `sonner`.

## Design

- Light theme default + dark mode toggle (CSS vars in `src/styles.css`, persisted in localStorage, applies `.dark` class on `<html>`).
- Modern blue accent: tune `--primary` to a clean SaaS blue (oklch), add `--primary-glow` and a soft gradient token for hero/CTA accents.
- Card-based, generous spacing, subtle borders, smooth hover/transition utilities.
- All colors via semantic tokens — no hardcoded color classes.

## Storage shape (localStorage)

```
awp:outputs       SavedOutput[]   { id, tool, title, createdAt, payload }
awp:activity      Activity[]      capped at 50
awp:settings      { theme, defaultTone }
```

## Prompts

Per-tool system prompts kept server-side in each `*.functions.ts` (or api route) — clear, structured, request JSON for meeting/task tools via `Output.object` + Zod schema.

## Settings

- Theme (Light/Dark/System).
- Default email tone.
- AI provider info (read-only: "Lovable AI — Gemini 3 Flash").
- Export all saved outputs as JSON download.
- Clear all data.

## Responsible AI

Persistent banner on every AI tool page:
> "AI-generated content may contain inaccuracies. Users should review outputs before making workplace decisions, sending communications, or sharing information."

## Build order

1. Theme tokens, sidebar shell, header, theme toggle, route stubs.
2. localStorage helpers + activity/saved hooks.
3. Dashboard with stats + quick actions + recent activity.
4. Email tool (server fn + UI).
5. Meeting summarizer (structured output).
6. Task planner (structured output + timeline).
7. Saved Outputs page + global search.
8. Settings page + export/clear.
9. Polish: loading skeletons, empty states, responsive pass, SEO `head()` per route.
