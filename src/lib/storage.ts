// localStorage helpers for the AI Workplace Productivity Assistant.
// Safe to import from any client component.

export type ToolId = "email" | "meetings" | "tasks";

export type EmailPayload = {
  recipient: string;
  purpose: string;
  tone: string;
  subject: string;
  body: string;
};

export type MeetingPayload = {
  notes: string;
  summary: string;
  decisions: string[];
  actionItems: string[];
  deadlines: string[];
  followUps: string[];
};

export type TaskItem = {
  title: string;
  priority: "high" | "medium" | "low";
  estimate: string;
  timeBlock: string;
};

export type TaskDay = {
  day: string;
  items: TaskItem[];
};

export type TaskPayload = {
  input: string;
  hours: string;
  days: TaskDay[];
  recommendations: string[];
};

export type SavedOutput = {
  id: string;
  tool: ToolId;
  title: string;
  createdAt: number;
  payload: EmailPayload | MeetingPayload | TaskPayload;
};

export type Activity = {
  id: string;
  tool: ToolId;
  title: string;
  createdAt: number;
};

const OUTPUTS_KEY = "awp:outputs";
const ACTIVITY_KEY = "awp:activity";
const THEME_KEY = "awp:theme";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch {
    /* ignore quota errors */
  }
}

export function getOutputs(): SavedOutput[] {
  return safeRead<SavedOutput[]>(OUTPUTS_KEY, []);
}

export function saveOutput(o: Omit<SavedOutput, "id" | "createdAt">): SavedOutput {
  const item: SavedOutput = {
    ...o,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const list = [item, ...getOutputs()].slice(0, 200);
  safeWrite(OUTPUTS_KEY, list);
  return item;
}

export function deleteOutput(id: string) {
  safeWrite(
    OUTPUTS_KEY,
    getOutputs().filter((o) => o.id !== id),
  );
}

export function getActivity(): Activity[] {
  return safeRead<Activity[]>(ACTIVITY_KEY, []);
}

export function logActivity(a: Omit<Activity, "id" | "createdAt">) {
  const item: Activity = { ...a, id: crypto.randomUUID(), createdAt: Date.now() };
  const list = [item, ...getActivity()].slice(0, 50);
  safeWrite(ACTIVITY_KEY, list);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(OUTPUTS_KEY);
  window.localStorage.removeItem(ACTIVITY_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: OUTPUTS_KEY }));
}

export function getTheme(): "light" | "dark" {
  return safeRead<"light" | "dark">(THEME_KEY, "light");
}

export function setTheme(theme: "light" | "dark") {
  safeWrite(THEME_KEY, theme);
}

export const TOOL_LABELS: Record<ToolId, string> = {
  email: "Smart Email",
  meetings: "Meeting Summary",
  tasks: "Task Plan",
};
