export const OWNER = 'joellimrl';
export const CACHE_KEY = 'joel-pages-v1';
export const MAX_AGE = 60 * 60 * 1000;

export function discoverProjects(repositories, owner = OWNER) {
  return repositories.filter(r => r.has_pages && !r.private && r.owner?.login?.toLowerCase() === owner.toLowerCase() && r.name.toLowerCase() !== `${owner}.github.io`.toLowerCase())
    .map(r => ({
      name: r.name,
      title: r.name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase()),
      description: r.description || '',
      language: r.language || 'Other',
      updated: r.pushed_at,
      // GitHub's default Pages route also redirects to configured custom domains.
      url: `https://${owner}.github.io/${encodeURIComponent(r.name)}/`,
      code: `https://github.com/${owner}/${encodeURIComponent(r.name)}`,
      archived: !!r.archived,
    }))
    .sort((a,b) => (Date.parse(b.updated) || 0) - (Date.parse(a.updated) || 0) || a.name.localeCompare(b.name));
}

export async function fetchRepositories(owner = OWNER, fetcher = fetch) {
  const repositories = [];
  for (let page = 1; ; page++) {
    const response = await fetcher(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&sort=full_name&per_page=100&page=${page}`, {headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Unexpected GitHub response');
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
}

export function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
    return cache && Number.isFinite(cache.savedAt) && Array.isArray(cache.repositories) ? cache : null;
  } catch { return null; }
}

export function saveCache(repositories) {
  const cache = {savedAt:Date.now(),repositories};
  try { localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); } catch { /* Browsing with storage disabled still works. */ }
  return cache;
}
