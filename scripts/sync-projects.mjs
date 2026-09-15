import { mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateManifest, safeWebUrl } from '../js/manifest.mjs';

const OWNER = 'joellimrl';

export async function syncProjects({ owner = OWNER, token = '', fetcher = fetch, now = new Date() } = {}) {
  const repositories = [];
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let page = 1; ; page++) {
    const response = await fetcher(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?type=owner&sort=full_name&per_page=100&page=${page}`, {
      headers, signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`Repository discovery failed (${response.status}); keeping the published collection.`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Invalid repository response');
    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  const candidates = repositories.filter(repo => repo.has_pages && !repo.private &&
    repo.owner?.login?.toLowerCase() === owner.toLowerCase() &&
    repo.name.toLowerCase() !== `${owner}.github.io`.toLowerCase());
  const projects = [];
  // Limit concurrent site probes; API credentials are never sent to project sites.
  for (let start = 0; start < candidates.length; start += 4) {
    const batch = await Promise.all(candidates.slice(start, start + 4).map(async repo => {
      const route = `https://${owner}.github.io/${encodeURIComponent(repo.name)}/`;
      let response = await fetcher(route, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (response.status === 405 || response.status === 501) {
        response = await fetcher(route, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
        await response.body?.cancel();
      }
      if (response.status === 404 || response.status === 410) return null;
      if (!response.ok) throw new Error(`Site check failed for ${repo.name} (${response.status}); keeping the published collection.`);
      const url = response.url || route;
      if (!safeWebUrl(url)) throw new Error(`Invalid Pages redirect for ${repo.name}`);
      return {
        name: repo.name,
        title: repo.name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase()),
        description: repo.description || '',
        language: repo.language || 'Other',
        updated: repo.pushed_at,
        url,
        code: `https://github.com/${owner}/${encodeURIComponent(repo.name)}`,
        archived: Boolean(repo.archived),
      };
    }));
    projects.push(...batch.filter(Boolean));
  }
  projects.sort((a, b) => (Date.parse(b.updated) || 0) - (Date.parse(a.updated) || 0) || a.name.localeCompare(b.name));
  return validateManifest({ version: 1, generatedAt: now.toISOString(), projects });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const manifest = await syncProjects({ token: process.env.GITHUB_TOKEN || '' });
    const directory = new URL('../data/', import.meta.url);
    await mkdir(directory, { recursive: true });
    const destination = new URL('projects.json', directory);
    const temporary = `${fileURLToPath(destination)}.tmp`;
    await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
    await rename(temporary, destination);
    console.log(`Synced ${manifest.projects.length} published projects at ${manifest.generatedAt}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
