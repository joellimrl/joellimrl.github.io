# Automatic project discovery

## What works in these prototypes

The three prototypes share a dependency-free browser module. It requests every page of `GET /users/joellimrl/repos?type=owner&per_page=100`, includes public repositories with `has_pages: true`, and excludes this portfolio. Forks and archived repositories are included; archived ones are labeled. The current account returned 35 public repositories, including 17 Pages projects plus this portfolio.

The collection reads repository names, descriptions, primary language, and code-update dates. It refreshes on a visit when its one-hour cache expires; Refresh forces a new request. All pages of a refresh must succeed before replacing cached data. API failures retain the current display, and a committed snapshot gives first-time visitors a fallback. A successful empty result clears the collection. No credential is needed or included in the browser.

New projects need no code change or presentation entry. The optional presentation map supplies illustrations and fallback descriptions for known projects. Unknown projects get a title derived from their repository name and an automatic initials illustration. Actual repository descriptions take precedence. The sort uses `pushed_at`, which is code activity, not the deployment date.

The default `https://joellimrl.github.io/REPOSITORY/` route is used instead of the repository's arbitrary homepage field. GitHub normally redirects this route to configured custom domains. All 17 current routes returned HTTP 200 on 2026-09-15. This is a point-in-time check; the browser feed discovers Pages configuration and does not monitor deployment success or health.

## Recommended production approach

Keep this same frontend, and move discovery into this repository's GitHub Actions build:

1. Run on a schedule (for example hourly), manually, and when this portfolio changes.
2. Paginate the account's repositories and filter for Pages enabled.
3. Read `GET /repos/{owner}/{repo}/pages` for each candidate to obtain its canonical `html_url`, including custom domains. Record Pages metadata and check the canonical URL. Distinguish configuration, build status, and URL health rather than treating `has_pages` as proof of a successful deployment. Keep the last good manifest on transient API errors; remove entries when a complete discovery confirms Pages was disabled or the repository was removed.
4. Generate a small public manifest and deploy it with the chosen design using the GitHub Pages deployment action. The schedule must actually deploy the artifact; committing with `GITHUB_TOKEN` alone should not be relied on to trigger a separate Pages build.
5. Have visitors read that manifest. This avoids each visitor spending GitHub's unauthenticated API quota and enables a centrally maintained fallback.

The public Pages metadata request for `sportsCalendar` returned 404 in this environment despite its live URL returning 200. For reliable cross-repository metadata, configure a GitHub App or a fine-grained token with **Pages: read** and repository metadata access across the selected repositories. Store it only in an Actions secret. The default workflow token is scoped to its own repository; do not assume it can read private or protected metadata in every repository.

This prototype intentionally lists public repositories owned by `joellimrl`. Private repositories with public Pages sites and organization-owned repositories need authenticated server-side discovery and an explicit choice about which metadata is safe to publish. Do not put that credential in frontend code.

Hourly discovery requires no workflow changes in newly deployed repositories. It is eventual, not instantaneous; scheduled Actions runs can be delayed and public-repository schedules can be disabled after inactivity. If immediate updates matter, a central GitHub App webhook can trigger a rebuild on a successful Pages deployment. A simpler alternative is a `repository_dispatch` step in each project's deploy workflow, at the cost of per-repository setup.

## Review and development

Run `python3 -m http.server 8765 --bind 127.0.0.1` from the repository and open `http://127.0.0.1:8765/prototypes/`. No package installation or build step is required. The original homepage is untouched.

Run data tests with `node --test tests/feed.test.mjs`. Browser checks cover all three layouts, search, sorting, reset, cache fallback, mobile overflow, and Playground's random-project dialog. Fonts use Google Fonts with local sans-serif fallbacks; project art is CSS and text, so no screenshot service is required.

No schedule, deployment, token, or GitHub setting has been changed as part of this review. Once a direction is selected, promote it to the homepage and add the server-side manifest workflow as the production integration.

## GitHub references

- [List repositories for a user](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [Get a GitHub Pages site](https://docs.github.com/en/rest/pages/pages#get-a-github-pages-site)
- [GitHub Pages and custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [Events that trigger workflows: schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
