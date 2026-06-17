import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Download, Trash2, Sun, Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme, useOutputs } from "@/hooks/use-storage";
import { clearAll } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Workplace AI" },
      { name: "description", content: "Manage theme, data, and AI provider settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const outputs = useOutputs();

  function exportData() {
    const blob = new Blob([JSON.stringify(outputs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workplace-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  }

  function reset() {
    if (!confirm("Delete all saved outputs and activity? This can't be undone.")) return;
    clearAll();
    toast.success("All data cleared");
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-sm">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold md:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your workspace.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Switch between light and dark theme.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Dark mode
          </Label>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI provider</CardTitle>
          <CardDescription>Your workspace uses Lovable AI — no setup required.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium">Lovable AI Gateway</p>
              <p className="text-xs text-muted-foreground">Model: google/gemini-2.5-flash</p>
            </div>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              Connected
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your data</CardTitle>
          <CardDescription>
            Saved outputs and activity are stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData} disabled={outputs.length === 0}>
            <Download className="h-4 w-4" /> Export ({outputs.length})
          </Button>
          <Button variant="outline" onClick={reset} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Clear all data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
