const SEVERITY_EMOJI = {
  critical:   "🔴",
  major:      "🟠",
  minor:      "🟡",
  suggestion: "💡",
};

const SEVERITY_ORDER = ["critical", "major", "minor", "suggestion"];

export function formatReport(plan, allFindings, score) {
  // Group findings by category
  const byCategory = {};
  for (const f of allFindings) {
    if (!byCategory[f.category]) byCategory[f.category] = [];
    byCategory[f.category].push(f);
  }

  // Count per severity
  const counts = { critical: 0, major: 0, minor: 0, suggestion: 0 };
  for (const f of allFindings) counts[f.severity]++;

  const lines = [];

  // Header
  lines.push(`# Code Review Report`);
  lines.push(`\n**PR Summary:** ${plan.pr_summary}`);
  lines.push(`**Risk Level:** ${SEVERITY_EMOJI[plan.overall_risk]} ${plan.overall_risk.toUpperCase()}`);
  lines.push(`**Score:** ${score}/100`);
  lines.push(
    `**Findings:** ${allFindings.length} total — ` +
    SEVERITY_ORDER.map((s) => `${counts[s]} ${s}`).join(", ")
  );
  lines.push("\n---\n");

  // Sections per category
  for (const [category, findings] of Object.entries(byCategory)) {
    const sorted = [...findings].sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(a.severity) -
        SEVERITY_ORDER.indexOf(b.severity)
    );

    lines.push(`## ${category.charAt(0).toUpperCase() + category.slice(1)}`);

    for (const f of sorted) {
      lines.push(
        `\n### ${SEVERITY_EMOJI[f.severity]} ${f.title} — \`${f.file}\`` +
        (f.line_range ? ` (lines ${f.line_range})` : "")
      );
      lines.push(`**Severity:** ${f.severity}`);
      lines.push(`\n${f.description}`);
      lines.push(`\n**Suggestion:** ${f.suggestion}`);
      if (f.code_snippet) {
        lines.push(`\n\`\`\`\n${f.code_snippet}\n\`\`\``);
      }
    }
    lines.push("\n---\n");
  }

  return lines.join("\n");
}

export function computeScore(findings) {
  // Start at 100, deduct per severity
  const DEDUCTIONS = { critical: 20, major: 10, minor: 3, suggestion: 1 };
  let score = 100;
  for (const f of findings) {
    score -= DEDUCTIONS[f.severity] ?? 0;
  }
  return Math.max(0, score);
}