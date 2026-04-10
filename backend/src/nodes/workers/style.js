import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { WorkerOutputSchema } from "../../state.js";
import { llm } from "../../utils/getLLM.js";


const SYSTEM = `You are a code style and maintainability reviewer.

Review the diff for style and maintainability issues only.

Look for:
- Unclear or misleading variable/function names
- Functions doing more than one thing (SRP violations)
- Deeply nested code that should be flattened or extracted
- Dead code or unused variables/imports
- Inconsistent patterns compared to surrounding code
- Missing or misleading comments on complex logic
- Magic numbers/strings that should be named constants

Only flag things that meaningfully hurt readability or future maintenance.
Do NOT flag trivial whitespace or personal preference issues.`;

export async function styleWorker(payload) {
  const { task, diff } = payload;
  const worker = llm.withStructuredOutput(WorkerOutputSchema);

  const result = await worker.invoke([
    new SystemMessage(SYSTEM),
    new HumanMessage(
      `Focus files: ${task.focus_files.join(", ")}\n` +
      `Checklist:\n- ${task.checklist.join("\n- ")}\n\n` +
      `Diff:\n${diff}`
    ),
  ]);

  console.log(`  🎨 Style worker: ${result.findings.length} findings`);
  return { findings: result.findings };
}