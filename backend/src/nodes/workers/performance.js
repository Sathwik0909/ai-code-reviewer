import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { WorkerOutputSchema } from "../../state.js";
import { llm } from "../../utils/getLLM.js";


const SYSTEM = `You are a performance-focused code reviewer.

Review the diff for performance issues only.

Look for:
- N+1 database query problems
- Synchronous blocking calls in async contexts
- Unnecessary re-renders or recomputations
- Large payload sizes returned to clients
- Missing database indexes (inferred from query patterns)
- Inefficient loops or nested iterations on large datasets
- Memory leaks (event listeners not removed, closures holding references)
- Missing caching opportunities

For each finding, give a concrete fix with before/after code.`;

export async function performanceWorker(payload) {
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

  console.log(`  ⚡ Performance worker: ${result.findings.length} findings`);
  return { findings: result.findings };
}