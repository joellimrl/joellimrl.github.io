export function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

export function validateManifest(data) {
  if (!data || data.version !== 1 || !Number.isFinite(Date.parse(data.generatedAt)) || !Array.isArray(data.projects)) {
    throw new Error('Invalid project manifest');
  }
  const names = new Set();
  for (const project of data.projects) {
    if (!project || !['name', 'title', 'description', 'language'].every(key => typeof project[key] === 'string') ||
        !project.name || names.has(project.name) || !safeWebUrl(project.url) || !safeWebUrl(project.code)) {
      throw new Error('Invalid project in manifest');
    }
    names.add(project.name);
  }
  return data;
}

export async function loadManifest(fetcher = fetch) {
  const response = await fetcher(new URL('../data/projects.json', import.meta.url), {
    cache: 'no-cache', signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Project list returned ${response.status}`);
  return validateManifest(await response.json());
}
