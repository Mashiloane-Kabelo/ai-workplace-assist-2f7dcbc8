import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Copy, Save, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ToolPage } from "@/components/tool-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateEmail } from "@/lib/ai.functions";
import { logActivity, saveOutput } from "@/lib/storage";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Workplace AI" },
      { name: "description", content: "Draft polished emails in seconds with AI tone control." },
    ],
  }),
  component: EmailPage,
});

const tones = ["Professional", "Formal", "Friendly", "Persuasive"] as const;

function EmailPage() {
  const generate = useServerFn(generateEmail);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("Professional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);

  async function onGenerate() {
    if (!recipient.trim() || !purpose.trim()) {
      toast.error("Add a recipient and purpose first.");
      return;
    }
    setLoading(true);
    try {
      const r = await generate({ data: { recipient, purpose, tone } });
      if (r) setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  function onCopy() {
    if (!result) return;
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    toast.success("Copied to clipboard");
  }

  function onSave() {
    if (!result) return;
    saveOutput({
      tool: "email",
      title: result.subject || `Email to ${recipient}`,
      payload: { recipient, purpose, tone, subject: result.subject, body: result.body },
    });
    logActivity({ tool: "email", title: result.subject || `Email to ${recipient}` });
    toast.success("Saved to your library");
  }

  function onClear() {
    setRecipient("");
    setPurpose("");
    setResult(null);
  }

  return (
    <ToolPage
      icon={Mail}
      title="Smart Email Generator"
      description="Tell the AI who you're writing to and what you need — get a ready-to-send draft."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                placeholder="e.g. Sarah, my manager"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                placeholder="What is this email about? What outcome do you want?"
                rows={5}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <RadioGroup
                value={tone}
                onValueChange={(v) => setTone(v as (typeof tones)[number])}
                className="grid grid-cols-2 gap-2"
              >
                {tones.map((t) => (
                  <Label
                    key={t}
                    htmlFor={`tone-${t}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem id={`tone-${t}`} value={t} />
                    {t}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={onGenerate} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClear} disabled={loading}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generated email</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-muted" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-muted" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={result.subject}
                    onChange={(e) => setResult({ ...result, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    rows={14}
                    value={result.body}
                    onChange={(e) => setResult({ ...result, body: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={onCopy}>
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                  <Button variant="outline" onClick={onGenerate} disabled={loading}>
                    <Sparkles className="h-4 w-4" /> Regenerate
                  </Button>
                  <Button onClick={onSave}>
                    <Save className="h-4 w-4" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                Your generated email will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  );
}
