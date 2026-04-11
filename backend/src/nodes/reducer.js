import { formatReport, computeScore } from "../utils/formatReport.js";
import { parsePRUrl } from "../utils/parsePRUrl.js";
import { Octokit } from "@octokit/rest";
import fs from "fs";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Normalize a string for fuzzy comparison
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // strip punctuation and spaces
    .trim();
}

// Check if two findings are about the same issue
function isDuplicate(a, b) {
  // Must be same file
  if (a.file !== b.file) return false;

  // Check 1: same normalized title
  if (normalize(a.title) === normalize(b.title)) return true;

  // Check 2: one title contains the other
  // catches "SQL Injection" vs "SQL Injection Vulnerability"
  const titleA = normalize(a.title);
  const titleB = normalize(b.title);
  if (titleA.includes(titleB) || titleB.includes(titleA)) return true;

  // Check 3: same line range
  if (
    a.line_range &&
    b.line_range &&
    a.line_range === b.line_range
  ) return true;

  return false;
}

function deduplicateFindings(findings) {
  const result = [];

  for (const candidate of findings) {
    const alreadyExists = result.some((existing) =>
      isDuplicate(existing, candidate)
    );
    if (!alreadyExists) {
      result.push(candidate);
    }
  }

  return result;
}

export async function reducer(state) {
  const SEVERITY_ORDER = ["critical", "major", "minor", "suggestion"];

  // Step 1: sort by severity first so we always keep the more severe duplicate
  const sorted = [...state.findings].sort(
    (a, b) =>
      SEVERITY_ORDER.indexOf(a.severity) -
      SEVERITY_ORDER.indexOf(b.severity)
  );

  // Step 2: smart dedup
  const deduped = deduplicateFindings(sorted);

  const removed = sorted.length - deduped.length;
  if (removed > 0) {
    console.log(`  🧹 Removed ${removed} duplicate findings`);
  }

  const score = computeScore(deduped);
  const report = formatReport(state.plan, deduped, score);

  // Save locally
  const filename = `review_${Date.now()}.md`;
  fs.writeFileSync(filename, report, "utf-8");

  // Post to GitHub
  try {
    const { owner, repo, pull_number } = parsePRUrl(state.pr_url);
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: report,
    });
    console.log(`✅ Comment posted to PR #${pull_number}`);
  } catch (err) {
    console.error("❌ Failed to post comment:", err.message);
  }

  console.log(`\n✅ Review complete! Score: ${score}/100`);
  console.log(`📄 Report saved to: ${filename}`);
  console.log(`🔍 Total findings: ${deduped.length} (${removed} duplicates removed)`);

  return { report };
}