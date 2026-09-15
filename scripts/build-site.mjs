import { mkdir, rm, copyFile, readFile } from 'node:fs/promises';
import { validateManifest } from '../js/manifest.mjs';

const root = new URL('../', import.meta.url);
const destination = new URL('dist/', root);
validateManifest(JSON.parse(await readFile(new URL('data/projects.json', root), 'utf8')));
await rm(destination, { recursive: true, force: true });
for (const directory of ['css', 'js', 'data']) {
  await mkdir(new URL(`${directory}/`, destination), { recursive: true });
}
// Publish only the production site, never development files or prototype assets.
for (const file of ['index.html', '.nojekyll', 'favicon.svg', 'css/playground.css', 'js/portfolio.mjs', 'js/manifest.mjs', 'data/projects.json']) {
  await copyFile(new URL(file, root), new URL(file, destination));
}
console.log('Built production site in dist/');
