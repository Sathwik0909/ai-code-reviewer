import "dotenv/config";
import { app } from "./graph.js";

async function reviewPR(prUrl) {
  console.log(`\n🚀 Starting review for: ${prUrl}\n`);

  const result = await app.invoke({
    pr_url:      prUrl,
    diff:        "",
    pr_metadata: null,
    language:    "",
    plan:        null,
    findings:    [],
    report:      "",
  });

  console.log("\n" + "=".repeat(60));
  console.log(result.report);
  return result;
}

// Run from CLI: node src/index.js <PR_URL>
const prUrl = process.argv[2];
if (!prUrl) {
  console.error("Usage: node src/index.js <github-pr-url>");
  process.exit(1);
}

reviewPR(prUrl);