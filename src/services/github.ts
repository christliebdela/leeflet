import { Item, ItemType, Priority, Project, Status } from '../types';

export const GITHUB_GLOBAL_TOKEN_KEY = 'leaf_github_global_token';

export interface GitHubIssueLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  labels: (GitHubIssueLabel | string)[];
  user: {
    login: string;
    avatar_url: string;
  } | null;
  assignee: {
    login: string;
    avatar_url: string;
  } | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: Record<string, unknown>;
}

export interface GitHubTokenStatus {
  ok: boolean;
  username?: string;
  name?: string;
  avatarUrl?: string;
  rateLimitRemaining?: number;
  rateLimitLimit?: number;
  error?: string;
}

export interface SyncGitHubResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  totalFetched: number;
  error?: string;
}

export function getGlobalGitHubToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(GITHUB_GLOBAL_TOKEN_KEY);
    return token ? token.trim() : null;
  } catch {
    return null;
  }
}

export function setGlobalGitHubToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!token || !token.trim()) {
      localStorage.removeItem(GITHUB_GLOBAL_TOKEN_KEY);
    } else {
      localStorage.setItem(GITHUB_GLOBAL_TOKEN_KEY, token.trim());
    }
  } catch {
    // Ignore storage errors
  }
}

export function getEffectiveGitHubToken(projectToken?: string | null): string | null {
  if (projectToken && projectToken.trim()) {
    return projectToken.trim();
  }
  return getGlobalGitHubToken();
}

/**
 * Parses various GitHub repository string formats:
 * - "owner/repo"
 * - "https://github.com/owner/repo"
 * - "https://github.com/owner/repo.git"
 * - "git@github.com:owner/repo.git"
 */
export function parseGitHubRepo(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  let clean = input.trim();

  // Remove trailing .git and trailing slashes
  clean = clean.replace(/\.git$/i, '').replace(/\/+$/, '');

  // Match git@github.com:owner/repo
  const sshMatch = clean.match(/^git@github\.com:([^/]+)\/([^/]+)$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Match https://github.com/owner/repo or github.com/owner/repo
  const urlMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }

  // Match plain owner/repo
  const plainMatch = clean.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (plainMatch) {
    return { owner: plainMatch[1], repo: plainMatch[2] };
  }

  return null;
}

/**
 * Verifies a GitHub personal access token and retrieves current user and rate limit info.
 */
export async function testGitHubConnection(token?: string | null): Promise<GitHubTokenStatus> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    const endpoint = token ? 'https://api.github.com/user' : 'https://api.github.com/rate_limit';
    const res = await fetch(endpoint, { headers });

    const remaining = res.headers.get('x-ratelimit-remaining');
    const limit = res.headers.get('x-ratelimit-limit');

    if (!res.ok) {
      if (res.status === 401) {
        return { ok: false, error: 'Invalid or expired GitHub Personal Access Token.' };
      }
      if (res.status === 403 && remaining === '0') {
        return { ok: false, error: 'GitHub API rate limit exceeded. Please configure a Personal Access Token.' };
      }
      return { ok: false, error: `GitHub API error (${res.status}): ${res.statusText}` };
    }

    const data = await res.json();
    return {
      ok: true,
      username: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      rateLimitRemaining: remaining ? parseInt(remaining, 10) : undefined,
      rateLimitLimit: limit ? parseInt(limit, 10) : undefined,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error connecting to GitHub API.' };
  }
}

/**
 * Fetches issues from a GitHub repository, filtering out pull requests.
 */
export async function fetchGitHubIssues(params: {
  owner: string;
  repo: string;
  token?: string | null;
  state?: 'open' | 'closed' | 'all';
  perPage?: number;
}): Promise<GitHubIssue[]> {
  const { owner, repo, token, state = 'open', perPage = 100 } = params;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };

  const effectiveToken = getEffectiveGitHubToken(token);
  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&sort=updated&direction=desc`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Repository "${owner}/${repo}" not found. If it's a private repository, please add a GitHub Personal Access Token.`
      );
    }
    if (res.status === 401) {
      throw new Error('Invalid GitHub Personal Access Token.');
    }
    if (res.status === 403) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please configure a Personal Access Token in Settings.');
      }
      throw new Error(`GitHub API access denied (${res.status}). Verify repository permissions.`);
    }
    throw new Error(`Failed to fetch GitHub issues (${res.status}): ${res.statusText}`);
  }

  const data = (await res.json()) as GitHubIssue[];

  // GitHub returns pull requests as issues with a pull_request object; filter them out
  return data.filter((item) => !item.pull_request);
}

/**
 * Maps GitHub label names and issue data into Leeflet item fields.
 */
export function mapGitHubIssueToItemFields(issue: GitHubIssue): {
  type: ItemType;
  priority: Priority;
  tags: string[];
  status: Status;
} {
  const labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name));
  const lowerLabels = labels.map((l) => l.toLowerCase());

  // Determine ItemType
  let type: ItemType = 'task';
  if (lowerLabels.some((l) => l.includes('bug') || l.includes('defect') || l.includes('fix'))) {
    type = 'bug';
  } else if (lowerLabels.some((l) => l.includes('enhancement') || l.includes('improvement') || l.includes('perf'))) {
    type = 'improvement';
  } else if (lowerLabels.some((l) => l.includes('feature') || l.includes('idea') || l.includes('proposal'))) {
    type = 'idea';
  } else if (lowerLabels.some((l) => l.includes('research') || l.includes('investigat') || l.includes('spike'))) {
    type = 'research';
  } else if (lowerLabels.some((l) => l.includes('question') || l.includes('help') || l.includes('discuss'))) {
    type = 'question';
  } else if (lowerLabels.some((l) => l.includes('doc') || l.includes('note'))) {
    type = 'note';
  }

  // Determine Priority
  let priority: Priority = 'none';
  if (lowerLabels.some((l) => l.includes('critical') || l.includes('p0') || l.includes('urgent') || l.includes('blocker'))) {
    priority = 'critical';
  } else if (lowerLabels.some((l) => l.includes('high') || l.includes('p1') || l.includes('major'))) {
    priority = 'high';
  } else if (lowerLabels.some((l) => l.includes('medium') || l.includes('p2') || l.includes('normal'))) {
    priority = 'medium';
  } else if (lowerLabels.some((l) => l.includes('low') || l.includes('p3') || l.includes('minor'))) {
    priority = 'low';
  }

  // Determine Status
  let status: Status = 'inbox';
  if (issue.state === 'closed') {
    status = 'done';
  }

  return {
    type,
    priority,
    tags: labels,
    status,
  };
}

/**
 * Synchronizes issues from a project's linked GitHub repository into Leeflet.
 */
export async function syncGitHubIssuesForProject(params: {
  project: Project;
  existingItems: Item[];
  createItem: (data: any) => Promise<Item>;
  updateItem: (item: Item) => Promise<void>;
  state?: 'open' | 'closed' | 'all';
  force?: boolean;
}): Promise<SyncGitHubResult> {
  const { project, existingItems, createItem, updateItem, state = project.githubSyncState || 'open', force = false } = params;

  if (!project.githubRepo) {
    return { success: false, createdCount: 0, updatedCount: 0, totalFetched: 0, error: 'No GitHub repository configured for this project.' };
  }

  // 1-minute rate limit cooldown per project
  if (!force && project.githubLastSyncedAt) {
    const lastSync = new Date(project.githubLastSyncedAt).getTime();
    if (!isNaN(lastSync)) {
      const elapsed = Date.now() - lastSync;
      if (elapsed < 60000) {
        const remainingSec = Math.ceil((60000 - elapsed) / 1000);
        return {
          success: false,
          createdCount: 0,
          updatedCount: 0,
          totalFetched: 0,
          error: `Sync is on cooldown. Please wait ${remainingSec}s before syncing again.`,
        };
      }
    }
  }

  const parsed = parseGitHubRepo(project.githubRepo);
  if (!parsed) {
    return { success: false, createdCount: 0, updatedCount: 0, totalFetched: 0, error: `Invalid repository name "${project.githubRepo}". Expected "owner/repo".` };
  }

  let issues: GitHubIssue[];
  try {
    issues = await fetchGitHubIssues({
      owner: parsed.owner,
      repo: parsed.repo,
      token: project.githubToken,
      state,
    });
  } catch (err: any) {
    return { success: false, createdCount: 0, updatedCount: 0, totalFetched: 0, error: err.message };
  }

  // Map existing items for this project by githubIssueNumber
  const projectItems = existingItems.filter((i) => i.projectId === project.id);
  const itemsByIssueNum = new Map<number, Item>();
  for (const item of projectItems) {
    if (item.githubIssueNumber !== undefined && item.githubIssueNumber !== null) {
      itemsByIssueNum.set(item.githubIssueNumber, item);
    }
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const issue of issues) {
    const existing = itemsByIssueNum.get(issue.number);
    const { type, priority, tags, status } = mapGitHubIssueToItemFields(issue);

    if (existing) {
      // Update existing item while preserving local assignments and progress if open
      const needsUpdate =
        existing.title !== issue.title ||
        existing.content !== (issue.body || '') ||
        (issue.state === 'closed' && existing.status !== 'done') ||
        existing.githubIssueState !== issue.state;

      if (needsUpdate) {
        // Merge tags without losing custom local tags
        const mergedTags = Array.from(new Set([...existing.tags, ...tags]));

        await updateItem({
          ...existing,
          title: issue.title,
          content: issue.body || '',
          tags: mergedTags,
          // If closed on GitHub, mark done locally
          status: issue.state === 'closed' ? 'done' : existing.status,
          completedAt: issue.state === 'closed' ? (issue.closed_at || new Date().toISOString()) : existing.completedAt,
          githubIssueNumber: issue.number,
          githubIssueUrl: issue.html_url,
          githubIssueState: issue.state,
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
      }
    } else {
      // Create new item
      await createItem({
        projectId: project.id,
        title: issue.title,
        content: issue.body || '',
        type,
        priority: priority === 'none' ? 'medium' : priority,
        status,
        tags,
        githubIssueNumber: issue.number,
        githubIssueUrl: issue.html_url,
        githubIssueState: issue.state,
        completedAt: issue.state === 'closed' ? (issue.closed_at || new Date().toISOString()) : null,
      });
      createdCount++;
    }
  }

  return {
    success: true,
    createdCount,
    updatedCount,
    totalFetched: issues.length,
  };
}
