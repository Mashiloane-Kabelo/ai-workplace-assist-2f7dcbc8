import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Sparkles, Save, Copy } from "lucide-react";
import { toast } from "sonner";
import { ToolPage } from "@/components/tool-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { summarizeMeeting } from "@/lib/ai.functions";
import { logActivity, saveOutput, type MeetingPayload } from "@/lib/storage";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Workplace AI" },
      { name: "description", content: "Turn raw meeting notes into summaries, decisions, and action items." },
    ],
  }),
  component: MeetingsPage,
});

type Result = Omit<MeetingPayload, "notes">;

const SAMPLE = `Q3 planning — Oct 14
- Reviewed Q2 metrics: NPS up 6 pts, churn at 3.1%
- Decided to ship new dashboard by Nov 30 (Owner: Maya)
- Marketing will run launch campaign in Dec, brief due Nov 15 (Owner: Tom)
- Engineering needs 2 more contractors — budget approved
- Follow up next week on hiring pipeline and customer interview notes`;

function MeetingsPage() {
  const run = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function onGenerate() {
    if (notes.trim().length < 10) {
      toast.error("Paste your meeting notes first.");
      return;
    }
    setLoading(true);
    try {
      const r = await run({ data: { notes } });
      if (r) setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  function onSave() {
    if (!result) return;
    const title = result.summary.slice(0, 80);
    saveOutput({
      tool: "meetings",
      title,
      payload: { notes, ...result },
    });
    logActivity({ tool: "meetings", title });
    toast.success("Saved to your library");
  }

  function onCopyAll() {
    if (!result) return;
    const txt = [
      `Summary:\n${result.summary}`,
      `Decisions:\n${result.decisions.map((d) => `- ${d}`).join("\n")}`,
      `Action Items:\n${result.actionItems.map((d) => `- ${d}`).join("\n")}`,
      `Deadlines:\n${result.deadlines.map((d) => `- ${d}`).join("\n")}`,
      `Follow-ups:\n${result.followUps.map((d) => `- ${d}`).join("\n")}`,
    ].join("\n\n");
    navigator.clipboard.writeText(txt);
    toast.success("Copied summary");
  }

  return (
    <ToolPage
      icon={FileText}
      title="Meeting Notes Summarizer"
      description="Paste your raw notes — get a clean executive summary with decisions, actions, and deadlines."
    >
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Meeting notes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setNotes(SAMPLE)}>
              Try sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="sr-only">
                Notes
              </Label>
              <Textarea
                id="notes"
                rows={18}
                value={notes}
                placeholder="Paste raw meeting notes, transcript, or bullet points here..."
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button onClick={onGenerate} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Summarizing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Summarize
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-3">
          {loading && <SkeletonResult />}
          {!loading && !result && (
            <Card>
              <CardContent className="py-20">
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  Structured summary will appear here.
                </div>
              </CardContent>
            </Card>
          )}
          {!loading && result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Executive summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <ListCard title="Key decisions" items={result.decisions} />
                <ListCard title="Action items" items={result.actionItems} />
                <ListCard title="Deadlines" items={result.deadlines} />
                <ListCard title="Follow-ups" items={result.followUps} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onCopyAll}>
                  <Copy className="h-4 w-4" /> Copy all
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

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">None.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonResult() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${60 + Math.random() * 40}%` }} />
        ))}
      </CardContent>
    </Card>
  );
}
