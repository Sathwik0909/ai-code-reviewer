
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { WorkerOutputSchema } from "../../state.js";
import { llm } from "../../utils/getLLM.js";


const SYSTEM = `You are a security-focused code reviewer.

Review the diff for security vulnerabilities only.

Look for:
- SQL / NoSQL injection
- XSS vulnerabilities
- Hardcoded secrets / API keys / passwords
- Insecure authentication or authorization logic
- Unsafe deserialization
- Path traversal
- Missing input validation
- Exposed sensitive data in logs or responses

For each finding:
- Be specific: cite the exact file and line range
- Give a concrete, copy-pasteable fix in code_snippet
- Do NOT report style issues or performance issues here`;

export async function securityWorker(payload) {
  const { task, diff, pr_metadata } = payload;
  const worker = llm.withStructuredOutput(WorkerOutputSchema);

  const result = await worker.invoke([
    new SystemMessage(SYSTEM),
    new HumanMessage(
      `Focus files: ${task.focus_files.join(", ")}\n` +
      `Checklist:\n- ${task.checklist.join("\n- ")}\n\n` +
      `Diff:\n${diff}`
    ),
  ]);

  console.log(`  🔒 Security worker: ${result.findings.length} findings`);
  const correctedFindings = result.findings.map((f) => ({
    ...f,
    category: "security", 
  }));

  return { findings: correctedFindings };
}