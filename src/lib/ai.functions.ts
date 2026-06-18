import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z, type ZodTypeAny } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-2.5-flash";

function gateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}

function handleGatewayError(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
  if (msg.includes("402"))
    throw new Error("AI credits exhausted. Add credits to your Lovable workspace to continue.");
  throw new Error(msg || "AI request failed.");
}

function extractJson(text: string): unknown {
  let t = text.trim();
  // strip ```json ... ``` fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  // fall back to first {...} block
  if (!t.startsWith("{") && !t.startsWith("[")) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

async function generateStructured<T extends ZodTypeAny>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
): Promise<z.infer<T>> {
  try {
    const { text } = await generateText({
      model: gateway()(MODEL),
      system: `${systemPrompt}\n\nYou MUST respond with ONLY valid JSON matching the requested shape. No prose, no markdown fences, no commentary.`,
      prompt: userPrompt,
    });
    const parsed = extractJson(text);
    return schema.parse(parsed);
  } catch (e) {
    handleGatewayError(e);
  }
}

/* -------------------- Email generator -------------------- */

const EmailInput = z.object({
  recipient: z.string().min(1),
  purpose: z.string().min(3),
  tone: z.enum(["Formal", "Friendly", "Persuasive", "Professional"]),
});

const EmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) =>
    generateStructured(
      EmailSchema,
      "You are an expert business writer.",
      `Write a ${data.tone.toLowerCase()} email to ${data.recipient}. Purpose: ${data.purpose}\n\nReturn JSON: {"subject": string, "body": string}.\n- subject: a compelling subject line\n- body: a well-structured email with clear paragraphs and a natural sign-off ending with "Best regards,". Do not include placeholders like [Your Name].`,
    ),
  );

/* -------------------- Meeting summarizer -------------------- */

const MeetingInput = z.object({ notes: z.string().min(10) });

const MeetingSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.string()),
  deadlines: z.array(z.string()),
  followUps: z.array(z.string()),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) =>
    generateStructured(
      MeetingSchema,
      "You are an expert meeting analyst.",
      `Read these meeting notes and extract a structured summary.\n\nNotes:\n"""${data.notes}"""\n\nReturn JSON: {"summary": string, "decisions": string[], "actionItems": string[], "deadlines": string[], "followUps": string[]}.\n- summary: 2-4 sentence executive summary\n- decisions: clear decisions made\n- actionItems: concrete next actions with owners when mentioned\n- deadlines: dates and what is due\n- followUps: follow-up tasks or topics for the next meeting\n\nIf a section has no items, return an empty array. Always include every field.`,
    ),
  );

/* -------------------- Task planner -------------------- */

const TaskInput = z.object({
  tasks: z.string().min(3),
  hours: z.string().optional(),
});

const TaskSchema = z.object({
  days: z.array(
    z.object({
      day: z.string(),
      items: z.array(
        z.object({
          title: z.string(),
          priority: z.enum(["high", "medium", "low"]),
          estimate: z.string(),
          timeBlock: z.string(),
        }),
      ),
    }),
  ),
  recommendations: z.array(z.string()),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TaskInput.parse(d))
  .handler(async ({ data }) =>
    generateStructured(
      TaskSchema,
      "You are a productivity coach.",
      `Build an actionable, time-blocked plan from this task list.\n\nTasks:\n"""${data.tasks}"""\n\nWorking hours: ${data.hours || "9:00-17:00"}\n\nReturn JSON: {"days": [{"day": string, "items": [{"title": string, "priority": "high"|"medium"|"low", "estimate": string, "timeBlock": string}]}], "recommendations": string[]}.\n- days: 1-5 day plan. Each day has a label (e.g. "Monday" or "Day 1") and items with title, priority, estimate (e.g. "45 min"), and timeBlock (e.g. "09:00 - 09:45").\n- recommendations: 3-5 productivity tips tailored to this workload.\n\nGroup similar tasks, place high-priority work in mornings, and leave realistic buffer time.`,
    ),
  );
