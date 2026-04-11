import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { WorkerOutputSchema } from "../../state.js";
import { llm } from "../../utils/getLLM.js";



const SYSTEM = `You are a testing and quality assurance reviewer.

Review the diff for test coverage and quality issues only.

Look for:
- New functions/methods with no corresponding tests added
- Tests with weak assertions (e.g. just checking "not null")
- Missing edge case tests (empty input, null, max values, concurrent access)
- Tests that test implementation details instead of behaviour
- Flaky test patterns (hardcoded timeouts, date dependencies)
- Missing error path tests

If no test files are present in the diff at all, flag that as a single major finding.`;

export async function testingWorker(payload) {
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

  console.log(`  🧪 Testing worker: ${result.findings.length} findings`);
  const correctedFindings = result.findings.map((f) => ({
    ...f,
    category: "testing", 
  }));

  return { findings: correctedFindings };
}