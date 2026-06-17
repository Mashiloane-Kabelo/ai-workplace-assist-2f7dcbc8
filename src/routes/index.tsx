import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, TrendingUp, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActivity, useOutputs } from "@/hooks/use-storage";
import { TOOL_LABELS, type ToolId } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Workplace AI" },
      { name: "description", content: "Overview of your AI productivity tools and recent activity." },
    ],
  }),
  component: Dashboard,
});

const toolIcon: Record<ToolId, typeof Mail> = {
  email: Mail,
  meetings: FileText,
  tasks: ListChecks,
};

const toolPath: Record<ToolId, "/email" | "/meetings" | "/tasks"> = {
  email: "/email",
  meetings: "/meetings",
  tasks: "/tasks",
};

function Dashboard() {
  const outputs = useOutputs();
  const activity = useActivity();

  const stats = [
    { label: "Emails Generated", value: outputs.filter((o) => o.tool === "email").length, icon: Mail },
    { label: "Meetings Summarized", value: outputs.filter((o) => o.tool === "meetings").length, icon: FileText },
    { label: "Tasks Planned", value: outputs.filter((o) => o.tool === "tasks").length, icon: ListChecks },
    { label: "Total Saved", value: outputs.length, icon: TrendingUp },
  ];

  const quickActions = [
    {
      to: "/email" as const,
      icon: Mail,
      title: "Smart Email",
      desc: "Draft professional emails in seconds with the right tone.",
    },
    {
      to: "/meetings" as const,
      icon: FileText,
      title: "Meeting Notes",
      desc: "Turn raw notes into summaries, decisions, and action items.",
    },
    {
      to: "/tasks" as const,
      icon: ListChecks,
      title: "Task Planner",
      desc: "Get a time-blocked plan tailored to your workload.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-10">
        <div className="absolute inset-0 gradient-soft opacity-70" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-3 gap-1">
              <Sparkles className="h-3 w-3" /> Powered by Lovable AI
            </Badge>
            <h2 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Welcome back — let's get more done today.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Draft emails, summarize meetings, and plan tasks with AI built for modern work.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md shadow-primary/20">
            <Link to="/email" className="gap-1">
              Start with email <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="flex items-center justify-between p-4 md:p-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold md:text-3xl">{s.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Quick actions</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((a) => (
            <Card key={a.to} className="group transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="flex h-full flex-col gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-sm">
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-semibold">{a.title}</h4>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
                <Button asChild variant="ghost" className="mt-auto justify-start px-0 text-primary hover:bg-transparent hover:text-primary">
                  <Link to={a.to} className="gap-1">
                    Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No activity yet — run a tool to see it here.
              </div>
            ) : (
              <ul className="divide-y">
                {activity.slice(0, 10).map((a) => {
                  const Icon = toolIcon[a.tool];
                  return (
                    <li key={a.id}>
                      <Link
                        to={toolPath[a.tool]}
                        className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {TOOL_LABELS[a.tool]} · {new Date(a.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
