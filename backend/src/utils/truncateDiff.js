// Keeps diff under token limit by prioritising changed lines
// Strips binary files, lock files (package-lock.json etc)

const SKIP_PATTERNS = [
  /package-lock\.json/,
  /yarn\.lock/,
  /\.png|\.jpg|\.svg|\.ico/,
  /dist\//,
  /build\//,
];

export function truncateDiff(diff, maxChars = 12000) {
  // Remove binary / lock files
  const lines = diff.split("\n");
  const filtered = [];
  let skip = false;

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      skip = SKIP_PATTERNS.some((p) => p.test(line));
    }
    if (!skip) filtered.push(line);
  }

  const cleaned = filtered.join("\n");

  // Hard truncate if still too long
  if (cleaned.length > maxChars) {
    return (
      cleaned.slice(0, maxChars) +
      "\n\n[DIFF TRUNCATED — too large to review in full]"
    );
  }
  return cleaned;
}