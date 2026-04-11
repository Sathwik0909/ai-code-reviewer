# 🔍 AI Code Reviewer

Automatically reviews GitHub Pull Requests using 5 specialized AI agents running in parallel. Give it a PR link and it generates a detailed report with severity scores, file references, line numbers, and concrete fix suggestions.

---

## Demo

```
🚀 Starting review for: https://github.com/owner/repo/pull/42

✅ Fetched PR: "Add user authentication" (8 files, lang: JavaScript)
✅ Plan created: 4 review tasks, risk: high

  🔒 Security worker:    4 findings
  ⚡ Performance worker: 2 findings
  🧠 Logic worker:       0 findings
  🧪 Testing worker:     1 findings
  🧹 Removed 1 duplicate findings

✅ Review complete! Score: 41/100
📄 Report saved to: review_1712345678.md
🔍 Total findings: 7
```

**Generated Report:**

```markdown
# Code Review Report

**PR Summary:** Adds user authentication with login endpoint and DB query.
**Risk Level:** 🟠 HIGH
**Score:** 41/100
**Findings:** 7 total — 2 critical, 3 major, 2 minor, 0 suggestion

## Security

### 🔴 SQL Injection Vulnerability — `db.js` (lines 2-4)
**Severity:** critical
SQL injection — user input interpolated directly into query string.
**Suggestion:** Use parameterized queries

### 🔴 Hardcoded Credentials — `index.js` (lines 15-18)
**Severity:** critical
...
```

---

## How It Works

Instead of sending the entire PR diff to one AI prompt, this project splits the review into **5 specialized agents running in parallel**. Each agent is focused on one concern and does it better as a result.

```
GitHub PR URL
      │
  [fetchPR]
  fetches diff + metadata via GitHub API
      │
  [Orchestrator]
  reads diff, decides which agents are needed,
  assigns relevant files to each
      │
  [Fanout]
      │
  ┌───┴──────────────────────────────┐
  │        │         │       │       │
[Security][Perf] [Style] [Testing][Logic]
 worker  worker  worker   worker  worker
  │        │         │       │       │
  └───┬────┴─────────┴───────┴───────┘
      │
  [Reducer]
  deduplicates, sorts by severity,
  computes score, writes report
      │
  Markdown Report
  (saved locally + posted as PR comment)
```

---

## Agents

| Agent | What It Checks |
|-------|----------------|
| 🔒 **Security** | SQL injection, hardcoded secrets, sensitive data exposure, auth bypass |
| ⚡ **Performance** | Blocking loops, N+1 queries, memory leaks, inefficient algorithms |
| 🎨 **Style** | Dead code, unclear naming, SRP violations, magic numbers |
| 🧪 **Testing** | Missing tests, weak assertions, untested edge cases, flaky patterns |
| 🧠 **Logic** | Off-by-one errors, null handling, race conditions, wrong assumptions |

---

## Tech Stack

- **[LangGraph.js](https://github.com/langchain-ai/langgraphjs)** — multi-agent orchestration and parallel fanout
- **[Groq](https://groq.com)** — ultra-fast LLM inference
- **[LangChain Groq](https://github.com/langchain-ai/langchainjs)** — LLM calls with structured output
- **[Octokit](https://github.com/octokit/rest.js)** — GitHub API for fetching PR diffs
- **[Zod](https://zod.dev)** — schema validation for structured AI outputs
- **Node.js / ES Modules**

---

## Project Structure

```
src/
├── getLLM.js
├── state.js
├── graph.js
├── index.js
├── server.js
├── nodes/
│   ├── fetchPR.js
│   ├── orchestrator.js
│   ├── fanout.js
│   ├── reducer.js
│   └── workers/
│       ├── security.js
│       ├── performance.js
│       ├── style.js
│       ├── testing.js
│       └── logic.js
└── utils/
    ├── parsePRUrl.js
    ├── truncateDiff.js
    └── formatReport.js
```

| File | Purpose |
|------|---------|
| `getLLM.js` | Single shared Groq LLM instance |
| `state.js` | LangGraph state + Zod schemas |
| `graph.js` | Graph wiring — nodes and edges |
| `index.js` | CLI entry point |
| `server.js` | Express webhook server |
| `nodes/fetchPR.js` | Fetches diff and metadata from GitHub API |
| `nodes/orchestrator.js` | Plans the review tasks from the diff |
| `nodes/fanout.js` | Fans out to parallel workers |
| `nodes/reducer.js` | Merges findings, deduplicates, generates report |
| `utils/parsePRUrl.js` | Parses github.com/owner/repo/pull/N |
| `utils/truncateDiff.js` | Strips lock files, truncates large diffs |
| `utils/formatReport.js` | Formats markdown report and computes score |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/ai-code-reviewer
cd ai-code-reviewer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
```

**GitHub token permissions needed** (Fine-grained token):

| Permission | Access |
|------------|--------|
| Contents | Read-only |
| Issues | Read and Write |
| Pull requests | Read and Write |
| Metadata | Read-only |

### 3. Run on any PR

```bash
npm run review https://github.com/owner/repo/pull/42
```

---

## Scoring

| Severity | Points Deducted |
|----------|----------------|
| 🔴 Critical | -20 |
| 🟠 Major | -10 |
| 🟡 Minor | -3 |
| 💡 Suggestion | -1 |

Score floors at 0. A clean PR with no findings scores 100/100.

---

## Why This Approach

**Why parallel agents instead of one prompt?**
When you ask a single AI to check everything at once it gets overwhelmed and misses things. Giving each agent a narrow specific scope produces significantly better findings — same principle as how real code reviews work where a security engineer reviews auth code separately from a backend engineer checking database queries.

**Why Groq?**
Groq's inference speed means all 5 agents complete in a fraction of the time it would take with standard inference. Since the agents run in parallel, the total review time is roughly equal to the slowest single agent — Groq keeps that fast.

**Why LangGraph?**
LangGraph handles parallel fanout and state management cleanly. The `Send` primitive lets the orchestrator fire off exactly the workers it needs based on the diff, and the annotated state reducer automatically concatenates findings from all workers without any manual wiring.

**Why structured outputs with Zod?**
Without schema enforcement LLM outputs are unpredictable. Zod schemas passed to `withStructuredOutput` guarantee every finding has the right fields — category, severity, file, line range, suggestion — so the reducer can process them reliably.

---


