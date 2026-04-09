import { Annotation } from "@langchain/langgraph";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────────────

export const FindingSchema = z.object({
  category: z.enum(["security", "performance", "style", "testing", "logic"]),
  severity: z.enum(["critical", "major", "minor", "suggestion"]),
  file: z.string(),
  line_range: z.string().optional(),
  title: z.string(),
  description: z.string(),
  suggestion: z.string(),
  code_snippet: z.string().optional(),
});

export const ReviewTaskSchema = z.object({
  id: z.number(),
  category: z.enum(["security", "performance", "style", "testing", "logic"]),
  focus_files: z.array(z.string()),
  checklist: z.array(z.string()),
});

export const ReviewPlanSchema = z.object({
  pr_summary: z.string(),
  tasks: z.array(ReviewTaskSchema),
  overall_risk: z.enum(["low", "medium", "high", "critical"]),
});

export const WorkerOutputSchema = z.object({
  category: z.string(),
  findings: z.array(FindingSchema),
});

// ── State ─────────────────────────────────────────────────────────────────────

export const StateAnnotation = Annotation.Root({
  // inputs
  pr_url:       Annotation({ reducer: (_, b) => b }),
  // fetched from GitHub
  diff:         Annotation({ reducer: (_, b) => b }),
  pr_metadata:  Annotation({ reducer: (_, b) => b }),
  language:     Annotation({ reducer: (_, b) => b }),
  // orchestrator output
  plan:         Annotation({ reducer: (_, b) => b }),
  // worker outputs concatenated
  findings:     Annotation({ reducer: (a, b) => [...(a ?? []), ...b] }),
  // final
  report:       Annotation({ reducer: (_, b) => b }),
});