import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks, Loader2, Sparkles, Save, Copy, Lightbulb, Clock } from "lucide-react";
import { toast } from "sonner";
import { ToolPage } from "@/components/tool-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { planTasks } from "@/lib/ai.functions";
import { logActivity, saveOutput, type TaskDay } from "@/lib/storage";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace AI" },
      { name: "description", content: "Get a time-blocked plan and productivity tips from your task list." },
    ],
  }),
  component: TasksPage,
});

type Result = { days: TaskDay[]; recommendations: string[] };

const priorityColor: Record<"high" | "medium" | "low", string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-warning/15 text-warning-foreground border-warning/30",
  low: "bg-success/10 text-success border-success/30",
};

function TasksPage() {
  const run = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState("9:00-17:00");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onGenerate() {
    if (tasks.trim().length < 3) {
      toast.error("Add at least one task.");
      return;
    }
    setLoading(true);
    try {
      const r = await run({ data: { tasks, hours } });
      if (r) setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan tasks");
    } finally {
      setLoading(false);
    }
  }

  function onSave() {
    if (!result) return;
    const title = `Plan: ${result.days.length} day${result.days.length > 1 ? "s" : ""}, ${result.days.reduce((n, d) => n + d.items.length, 0)} tasks`;
    saveOutput({ tool: "tasks", title, payload: { input: tasks, hours, ...result } });
    logActivity({ tool: "tasks", title });
    toast.success("Saved to your library");
  }

  function onCopy() {
    if (!result) return;
    const txt = result.days
      .map(
        (d) =>
          `${d.day}\n` +
          d.items.map((i) => `  • ${i.timeBlock} — ${i.title} (${i.priority}, ${i.estimate})`).join("\n"),
      )
      .join("\n\n");
    navigator.clipboard.writeText(txt);
    toast.success("Copied plan");
  }

  return (
    <ToolPage
      icon={ListChecks}
      title="AI Task Planner"
      description="Brain-dump your tasks. We'll prioritize and time-block them into a realistic plan."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 self-start">
          <CardHeader>
            <CardTitle className="text-base">Your tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tasks">Tasks (one per line)</Label>
              <Textarea
                id="tasks"
                rows={12}
                placeholder={"Finish Q3 report\nReview PR #482\nPrep customer call deck\nWrite blog draft"}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Working hours</Label>
              <Input
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="9:00-17:00"
              />
            </div>
            <Button onClick={onGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Planning…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Build my plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {!loading && !result && (
            <Card>
              <CardContent className="py-20">
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Your time-blocked plan will appear here.
                </div>
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card>
              <CardContent className="space-y-3 py-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded bg-muted" />
                ))}
              </CardContent>
            </Card>
          )}
          {!loading && result && (
            <>
              {result.days.map((day, di) => (
                <Card key={di}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4 text-primary" /> {day.day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {day.items.map((it, i) => (
                        <li
                          key={i}
                          className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3"
                        >
                          <div className="min-w-[100px] font-mono text-xs text-muted-foreground">
                            {it.timeBlock}
                          </div>
                          <div className="flex-1 text-sm font-medium">{it.title}</div>
                          <Badge variant="outline" className={priorityColor[it.priority]}>
                            {it.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{it.estimate}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
              {result.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Lightbulb className="h-4 w-4 text-primary" /> Productivity tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {result.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onCopy}>
                  <Copy className="h-4 w-4" /> Copy plan
                </Button>
                <Button variant="outline" onClick={onGenerate}>
                  <Sparkles className="h-4 w-4" /> Regenerate
                </Button>
                <Button onClick={onSave}>
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolPage>
  );
}
