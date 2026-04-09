import { Octokit } from "@octokit/rest";
import { parsePRUrl } from "../utils/parsePRUrl.js";
import { truncateDiff } from "../utils/truncateDiff.js";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Simple language detection from file extensions
function detectLanguage(files) {
  const extCounts = {};
  for (const f of files) {
    const ext = f.filename.split(".").pop();
    extCounts[ext] = (extCounts[ext] || 0) + 1;
  }
  const topExt = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const EXT_MAP = {
    js: "JavaScript", ts: "TypeScript", py: "Python",
    java: "Java", go: "Go", rs: "Rust", rb: "Ruby",
    cs: "C#", cpp: "C++", php: "PHP",
  };
  return EXT_MAP[topExt] ?? "Unknown";
}

export async function fetchPR(state) {
  const { owner, repo, pull_number } = parsePRUrl(state.pr_url);

  // Fetch PR metadata
  const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number });

  // Fetch list of changed files
  const { data: files } = await octokit.pulls.listFiles({
    owner, repo, pull_number, per_page: 100,
  });

  // Fetch raw diff
  const { data: rawDiff } = await octokit.pulls.get({
    owner, repo, pull_number,
    headers: { accept: "application/vnd.github.v3.diff" },
  });

  const diff = truncateDiff(rawDiff);
  const language = detectLanguage(files);

  const pr_metadata = {
    title:        pr.title,
    description:  pr.body || "",
    author:       pr.user.login,
    base_branch:  pr.base.ref,
    head_branch:  pr.head.ref,
    files_changed: files.map((f) => ({
      filename: f.filename,
      status:   f.status,         // added | modified | removed
      additions: f.additions,
      deletions: f.deletions,
    })),
    total_additions: pr.additions,
    total_deletions: pr.deletions,
  };

  console.log(`✅ Fetched PR: "${pr.title}" (${files.length} files, lang: ${language})`);

  return { diff, pr_metadata, language };
}