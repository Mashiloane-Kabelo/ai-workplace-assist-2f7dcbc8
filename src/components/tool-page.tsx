import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ResponsibleAINotice } from "./responsible-ai";

export function ToolPage({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-md shadow-primary/20">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <ResponsibleAINotice />
      {children}
    </div>
  );
}
