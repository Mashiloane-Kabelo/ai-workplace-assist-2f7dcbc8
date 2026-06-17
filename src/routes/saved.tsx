import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Mail, FileText, ListChecks, Search, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOutputs } from "@/hooks/use-storage";
import { deleteOutput, TOOL_LABELS, type EmailPayload, type MeetingPayload, type SavedOutput, type TaskPayload, type ToolId } from "@/lib/storage";

export const Route = createFileRoute("/saved")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Saved Outputs — Workplace AI" },
      { name: "description", content: "Browse and reuse your saved AI-generated outputs." },
    ],
  }),
  component: SavedPage,
});

const toolIcon: Record<ToolId, typeof Mail> = {
  email: Mail,
  meetings: FileText,
  tasks: ListChecks,
};

function SavedPage() {
  const { q: initialQ } = Route.useSearch();
  const outputs = useOutputs();
  const [q, setQ] = useState(initialQ);
  const [tab, setTab] = useState<"all" | ToolId>("all");

  const filtered = useMemo(() => {
    let list = outputs;
    if (tab !== "all") list = list.filter((o) => o.tool === tab);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(
        (o) => o.title.toLowerCase().includes(s) || JSON.stringify(o.payload).toLowerCase().includes(s),
      );
    }
    return list;
  }, [outputs, q, tab]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-sm">
            <Bookmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Saved outputs</h1>
            <p className="text-sm text-muted-foreground">All your AI generations in one place.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or content..."
            className="pl-9"
          />
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm font-medium">No saved outputs</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {q ? "Nothing matches your search." : "Generate something and save it to see it here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((o) => (
            <OutputCard key={o.id} item={o} />
          ))}
        </div>
      )}
    </div>
  );
}

function OutputCard({ item }: { item: SavedOutput }) {
  const Icon = toolIcon[item.tool];

  function preview(): string {
    if (item.tool === "email") {
      const p = item.payload as EmailPayload;
      return p.body;
    }
    if (item.tool === "meetings") {
      return (item.payload as MeetingPayload).summary;
    }
    const t = item.payload as TaskPayload;
    return t.days
      .flatMap((d) => d.items.map((i) => `${i.timeBlock} — ${i.title}`))
      .slice(0, 4)
      .join(" · ");
  }

  function copy() {
    if (item.tool === "email") {
      const p = item.payload as EmailPayload;
      navigator.clipboard.writeText(`Subject: ${p.subject}\n\n${p.body}`);
    } else {
      navigator.clipboard.writeText(JSON.stringify(item.payload, null, 2));
    }
    toast.success("Copied");
  }

  return (
    <Card className="group flex flex-col">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="line-clamp-1 text-sm">{item.title}</CardTitle>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{TOOL_LABELS[item.tool]}</Badge>
            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{preview()}</p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy className="h-3.5 w-3.5" /> Copy
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              deleteOutput(item.id);
              toast.success("Deleted");
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
