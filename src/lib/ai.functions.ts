import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
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
  .handler(async ({ data }) => {
    try {
      const { experimental_output } = await generateText({
        model: gateway()(MODEL),
        experimental_output: Output.object({ schema: EmailSchema }),
        prompt: `Write a ${data.tone.toLowerCase()} email to ${data.recipient}. Purpose: ${data.purpose}\n\nReturn a compelling subject line and a well-structured email body. Use clear paragraphs and a natural sign-off. Do not include placeholders like [Your Name] — leave the signature simply as "Best regards,".`,
      });
      return experimental_output;
    } catch (e) {
      handleGatewayError(e);
    }
  });

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
  .handler(async ({ data }) => {
    try {
      const { experimental_output } = await generateText({
        model: gateway()(MODEL),
        experimental_output: Output.object({ schema: MeetingSchema }),
        prompt: `You are an expert meeting analyst. Read the meeting notes and extract a structured summary.\n\nNotes:\n"""${data.notes}"""\n\nReturn:\n- summary: 2-4 sentence executive summary\n- decisions: clear decisions made\n- actionItems: concrete next actions with owners when mentioned\n- deadlines: dates and what is due\n- followUps: follow-up tasks or topics for the next meeting\n\nIf a section has no items, return an empty array.`,
      });
      return experimental_output;
    } catch (e) {
      handleGatewayError(e);
    }
  });

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
  .handler(async ({ data }) => {
    try {
      const { experimental_output } = await generateText({
        model: gateway()(MODEL),
        experimental_output: Output.object({ schema: TaskSchema }),
        prompt: `You are a productivity coach. Build an actionable, time-blocked plan from this task list.\n\nTasks:\n"""${data.tasks}"""\n\nWorking hours: ${data.hours || "9:00-17:00"}\n\nReturn:\n- days: 1-5 day plan. Each day has a label (e.g. "Monday" or "Day 1") and items with title, priority (high/medium/low), estimate (e.g. "45 min"), and timeBlock (e.g. "09:00 - 09:45").\n- recommendations: 3-5 productivity tips tailored to this workload (focus blocks, batching, breaks, etc.).\n\nGroup similar tasks, place high-priority work in mornings, and leave realistic buffer time.`,
      });
      return experimental_output;
    } catch (e) {
      handleGatewayError(e);
    }
  });
