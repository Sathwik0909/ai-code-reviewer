//for parsing PR URLs like https://github.com/owner/repo/pull/123
export function parsePRUrl(url) {
  const match = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) throw new Error(`Invalid PR URL: ${url}`);
  return {
    owner: match[1],
    repo: match[2],
    pull_number: parseInt(match[3]),
  };
}