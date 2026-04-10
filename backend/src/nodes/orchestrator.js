
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ReviewPlanSchema } from "../state.js";
import { llm } from "../utils/getLLM.js";

const SYSTEM = `You are a senior software engineer planning a structured code review.

Given a PR diff and metadata, produce a ReviewPlan.

Rules:
- Create one ReviewTask per category that is RELEVANT to this PR.
  Skip categories that clearly don't apply (e.g. no tests exist → skip testing only if test files are absent).
- For each task:
  - focus_files: list only the files most relevant to that category
  - checklist: 3–6 specific things to look for given THIS diff (not generic advice)
- overall_risk: your gut-level assessment of how risky this change is to merge
- pr_summary: one sentence describing what the PR does`;

export async function orchestrator(state) {
  const planner = llm.withStructuredOutput(ReviewPlanSchema);

  const fileList = state.pr_metadata.files_changed
    .map((f) => `${f.status}: ${f.filename} (+${f.additions}/-${f.deletions})`)
    .join("\n");

  const plan = await planner.invoke([
    new SystemMessage(SYSTEM),
    new HumanMessage(
      `PR Title: ${state.pr_metadata.title}\n` +
      `Description: ${state.pr_metadata.description}\n` +
      `Language: ${state.language}\n` +
      `Files Changed:\n${fileList}\n\n` +
      `Diff:\n${state.diff}`
    ),
  ]);

  console.log(`✅ Plan created: ${plan.tasks.length} review tasks, risk: ${plan.overall_risk}`);
  return { plan };
}