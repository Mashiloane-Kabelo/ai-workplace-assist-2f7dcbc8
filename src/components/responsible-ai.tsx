import { Info } from "lucide-react";

export function ResponsibleAINotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <p>
        AI-generated content may contain inaccuracies. Review outputs before sending communications
        or making workplace decisions.
      </p>
    </div>
  );
}
