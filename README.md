# Joel Lim — Playground

A personal collection of tools, games, and web experiments. Built with HTML, CSS, and JavaScript and published at [joellimrl.github.io](https://joellimrl.github.io/).

## Daily project discovery

`.github/workflows/pages.yml` runs at **08:17 Asia/Singapore every day** (`00:17 UTC`), on pushes to `main`, and manually from GitHub Actions.

The build paginates all public repositories owned by `joellimrl`, selects repositories with GitHub Pages enabled, and excludes this portfolio. It probes their default Pages URLs and follows redirects to obtain the live destination, including configured custom domains. Responding sites become cards automatically; no project list needs editing. Forks and archived repositories remain included. Private and organization-owned repositories are outside this public collection.

- New project with Pages enabled and a working site: appears at the next successful daily build.
- Disabled Pages, deleted repository, or a site returning 404/410: removed at the next successful build.
- API errors, timeout, or transient site failure: the workflow fails before deployment and the current published site stays intact.
- Metadata and URL checks are point-in-time reachability checks, not guarantees of successful builds or ongoing uptime. Sorting uses code updates (`pushed_at`), not deployment time.

The production browser reads `data/projects.json`, so visitors never call the GitHub API. Refresh reloads the published list; it does not start a build. Browser storage keeps the last successfully loaded collection for temporary network failures. The workflow uses GitHub’s automatically provided token for public repository metadata; no additional secret or token in frontend code is required. Public site probes carry no API authorization.

On code pushes, the workflow waits for GitHub’s existing branch-based Pages deployment to finish, then publishes the freshly generated artifact last. This avoids the older deployment replacing the new project list. Daily and manual runs deploy directly. Each successful workflow builds and deploys an artifact directly with `actions/deploy-pages`; it does not create daily commits. GitHub schedules can run late and public-repository scheduled workflows can be disabled after 60 days without repository activity. Use **Actions → Sync projects and deploy Playground → Run workflow** to update on demand or resume after enabling a disabled workflow.

## Local development

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open [the homepage](http://127.0.0.1:8765/). No package install is required.

With Node.js 24:

```sh
node --test tests/*.test.mjs
node scripts/sync-projects.mjs
node scripts/build-site.mjs
```

The sync only writes `data/projects.json` after complete discovery and checks succeed. The build copies only production assets to `dist/`. Review prototypes, tests, scripts, and documentation are excluded from the deployed artifact. A checked-in manifest supports local previews; daily production manifests live in the deployment artifact.

Browser checks require Playwright and Chrome:

```sh
node tests/production-browser-check.cjs
```

The default test address is `http://127.0.0.1:8765/dist`. Set `PREVIEW_URL` to another local build URL if needed. Tests cover filtering, searching visible descriptions, sorting, random-project selection, six viewport sizes, new daily data, and cached failure handling.

## Files

- `index.html`: Playground homepage, without prototype navigation.
- `css/playground.css`: responsive styles and CSS project illustrations.
- `js/portfolio.mjs`: cards, filters, search, and saved collection handling.
- `js/manifest.mjs`: shared manifest validation and loading.
- `scripts/sync-projects.mjs`: public repository discovery and URL checks.
- `scripts/build-site.mjs`: production artifact assembly.
- `.github/workflows/pages.yml`: daily sync and Pages deployment.
- `prototypes/`: the original three design directions, retained for reference.

Known project titles, fallback descriptions, and illustrations are optional presentation enhancements in `js/portfolio.mjs`. New repositories receive readable titles and initials automatically. Repository descriptions take precedence. The illustrations are project identities, not screenshots.

## References

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub repository API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
