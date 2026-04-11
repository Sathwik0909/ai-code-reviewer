import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { WorkerOutputSchema } from "../../state.js";
import { llm } from "../../utils/getLLM.js";

const SYSTEM = `You are a logic and correctness reviewer.

Review the diff for logical bugs and correctness issues only.

Look for:
- Off-by-one errors
- Incorrect boolean logic (wrong operator, missing negation)
- Unhandled null / undefined cases
- Race conditions in async code
- Wrong assumptions about data types or shapes
- Incorrect error handling (swallowing errors, wrong status codes)
- Business logic that contradicts the PR description
- State mutations that could cause unexpected side effects

Be precise — only flag things you are confident are actual bugs or risks.`;

export async function logicWorker(payload) {
  const { task, diff } = payload;
  const worker = llm.withStructuredOutput(WorkerOutputSchema);

  const result = await worker.invoke([
    new SystemMessage(SYSTEM),
    new HumanMessage(
      `Focus files: ${task.focus_files.join(", ")}\n` +
        `Checklist:\n- ${task.checklist.join("\n- ")}\n\n` +
        `Diff:\n${diff}`,
    ),
  ]);

  console.log(`  🧠 Logic worker: ${result.findings.length} findings`);

  const correctedFindings = result.findings.map((f) => ({
    ...f,
    category: "logic", 
  }));

  return { findings: correctedFindings };
}
