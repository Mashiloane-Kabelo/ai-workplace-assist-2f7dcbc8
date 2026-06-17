import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Moon, Search, Sun, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/use-storage";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/email": "Smart Email Generator",
  "/meetings": "Meeting Notes Summarizer",
  "/tasks": "AI Task Planner",
  "/saved": "Saved Outputs",
  "/settings": "Settings",
};

export function AppHeader() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const title = titles[pathname] ?? "Workplace AI";
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <div className="hidden md:block">
        <h1 className="font-display text-lg font-semibold">{title}</h1>
      </div>
      <form
        className="ml-auto hidden flex-1 max-w-sm md:block"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/saved", search: { q } as never });
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search saved outputs..."
            className="pl-9"
          />
        </div>
      </form>
      <div className="ml-auto flex items-center gap-1 md:ml-0">
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  YA
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    YA
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">You</span>
                  <span className="text-xs text-muted-foreground">demo workspace</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
