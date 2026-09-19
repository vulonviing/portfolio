# AGENTS.md

Project-specific context for working in this repo. Tool/workflow routing (which
skill, which agent, when to review) lives in `PLUGINS.md` — read that too.
Human-facing overview lives in `PORTFOLIO.md`.

## What this is

`emrecanulu.com` — a static personal portfolio. Plain HTML/CSS/vanilla JS at
the root, deployed via GitHub Pages (`CNAME`, `.nojekyll`, branch `main` /
root). No build step for the site itself. Four self-contained React + Vite
sub-apps live under `experiments/` and build into the site root.

## ⚠️ Generated vs hand-written — read this first

Half the site is **generated** by `scripts/build_static_site.py` from JSON +
Markdown in `content/`. Never hand-edit generated output — edit the source and
rebuild.

| Hand-written (edit directly) | Generated (edit the source instead) |
|---|---|
| `index.html`, `about.html`, `entry.html` | `projects.html`, `research.html`, `resonance.html` |
| `content/**/*.md`, `content/**/_index.json` | `projects/*.html`, `research/*.html`, `sitemap.xml` |

```bash
python3 scripts/build_static_site.py
```

`generate_entry_pages()` **deletes** any `projects/*.html` / `research/*.html`
not listed in the matching `_index.json` — don't leave orphan detail pages
lying around expecting them to survive a rebuild.

`partials/` exists but is **empty and unused** — there is no HTML include
mechanism. Shared header/footer/`<head>`/GA/theme-bootstrap markup lives in two
places that must be kept in sync by hand: the `HEADER_HTML` / `FOOTER_HTML` /
`THEME_BOOTSTRAP` / `GA_SNIPPET` constants near the top of
`scripts/build_static_site.py`, and literal copies in `index.html`,
`about.html`, `entry.html`. Changing nav or footer means editing all of these.

## Resonance is unindexed by design

`resonance.html`, and everything it links to (`anlamazdin/`, `sneak-peek/`,
`cuda-stack/`), is meant to be found by people, not search engines or AI
crawlers. This used to be a set of hand-applied SEO edits that a plain
rebuild of `scripts/build_static_site.py` would silently undo — see git
history before 2026-09 if you need the old drift table. It's now generated on
purpose: `LIST_PAGE_CONFIG["resonance"]` carries `robots`, `extra_robots`, and
`sitemap_exclude`, `render_resonance_card()` emits `rel="nofollow"` on every
card link, and `HEADER_HTML`'s Resonance nav link carries `rel="nofollow"`
too. `robots.txt` additionally blocks AI crawlers (GPTBot, ClaudeBot, CCBot,
PerplexityBot, …) from `/resonance.html` and each experiment's paths.

**Rule:** if you run the build, `git diff` the result before committing.
`resonance.html`'s `<head>` robots metas, its cards' `rel="nofollow"`, and
`sitemap.xml` (no `resonance.html` entry) should come out unchanged unless
you intentionally touched Resonance config. If you add a new experiment,
update `robots.txt` (both the asset-path group and the AI-crawler group) to
match the existing entries.

## Repo layout

```
index.html, about.html, entry.html   Hand-written pages
projects.html, research.html,        Generated list pages
resonance.html
projects/*.html, research/*.html     Generated detail pages
content/
  projects/   _index.json + one .md per project
  research/   _index.json + one .md per research entry
  resonance/  _index.json only (no markdown — links out to sub-apps)
assets/
  css/   base.css (tokens/reset/type), layout.css, components.css
  js/    site.js (nav, theme, Resonance hover-audio previews), entry.js
  img/   favicon.svg, og-cover.png
scripts/
  build_static_site.py     the generator
  sync_github_readmes.py   pulls README content from GitHub
experiments/
  anlamazdin/   React+Vite source → builds into /anlamazdin/
  sneak-peek/   React+Vite source → builds into /sneak-peek/
  cuda-stack/   React+Vite source → builds into /cuda-stack/
  epoch/        React+Vite source → builds into /epoch/
anlamazdin/, sneak-peek/, cuda-stack/, epoch/   Built output, committed, served by Pages
partials/    empty, unused
```

## Common tasks

**Add a project or research entry**
1. Add `content/<section>/<slug>.md`.
2. Append an entry to `content/<section>/_index.json` (array order = page
   order).
3. `python3 scripts/build_static_site.py`.

**Mirror a GitHub README instead of writing content by hand**
Add `content_source: {"type": "github_readme", "branch": "main", "path":
"README.md"}` to the `_index.json` entry, then:
```bash
python3 scripts/sync_github_readmes.py
python3 scripts/build_static_site.py
```
`.github/workflows/sync-readmes.yml` runs this hourly and on
`workflow_dispatch` / `repository_dispatch: sync-project-readmes`, committing
as `github-actions[bot]`. **Never hand-edit a `.md` with `content_source` set
— the next sync overwrites it.**

**Add a Resonance card**
Add to `content/resonance/_index.json` (`href`, `visualTheme`, optional
`audioPreview`) — but `visualTheme` is a hard-coded branch in
`render_resonance_card()` (build script; unknown themes raise instead of
silently reusing another card's reveal markup) and, if the card should have a
hover-audio preview, `audioPreview` needs a matching branch in
`setupResonanceCards()` (`assets/js/site.js`) too. A card can omit
`audioPreview` entirely to stay silent (`cuda-stack` does this). Remember to
add the new experiment's paths to `robots.txt` in both groups.

**Change nav or footer**
Edit `HEADER_HTML`/`FOOTER_HTML` in `scripts/build_static_site.py` *and* the
literal copies in `index.html`, `about.html`, `entry.html`. Missing one means
the site and the generator disagree on the next rebuild.

**Work on a sub-app**
```bash
cd experiments/<anlamazdin|sneak-peek|cuda-stack|epoch>
npm install
npm run dev
```
To publish: `npm run build` writes directly into the site root's `<name>/`
directory (`vite.config.js` sets `outDir: '../../<name>'`,
`emptyOutDir: true`) — commit that directory. `anlamazdin` has tests
(`npm test` → `node --test` over `tests/*.test.js`) and `npm run lint`;
`sneak-peek` and `cuda-stack` have `npm run lint` only, no tests.

`epoch` is a read-only thesis viewer. Before building it, export one coherent
example per use case from the thesis checkout; the exporter masks all tabular
cases and keeps UC4's public-document artifacts intact:

```bash
cd experiments/epoch
"/path/to/Siemens Thesis/.venv/bin/python" scripts/export_static_data.py --thesis-root "/path/to/Siemens Thesis"
npm run test:privacy
npm run build
"/path/to/Siemens Thesis/.venv/bin/python" scripts/audit_public_release.py --thesis-root "/path/to/Siemens Thesis"
```

The generated staging data under `experiments/epoch/public/data/` is ignored;
the publishable, verified copy is included in the committed `/epoch/` output.
The audit must pass after every EPOCH rebuild; `noindex` is not a privacy check.

### Science Slam deck and live voting

`experiments/who-speaks-for-the-crowd/` is the source for the unlisted Science
Slam presentation and audience voting UI. Its production output is committed
under `who-speaks-for-the-crowd/`. Before publishing it, run `npm test`,
`npm run lint`, and `npm run build` from the experiment directory.

The production API is `https://vote-api.emrecanulu.com`; its deployment and
operator runbook live outside this repo at
`../science slam seds/docs/live-voting-operations.md`. Never commit API admin
tokens, Cloudflare connector tokens, participant secrets, or local `.env`
files here.

This deck must remain absent from the portfolio home page, navigation,
Resonance cards, content indexes, and `sitemap.xml`. Preserve the strict
`noindex, nofollow, noarchive, nosnippet, noimageindex` meta in both source and
built HTML. Preserve both `/who-speaks-for-the-crowd/` blocks in `robots.txt`.
Do not block the HTML route for generic search crawlers: they need to fetch it
to observe `noindex`. AI crawlers are blocked from the entire route.

## Conventions

- **CSS**: no inline `<style>`, no framework, no bundler. Load order is always
  `base.css` → `layout.css` → `components.css`. Use the `--color-*`,
  `--radius-*`, `--font-sans` etc. tokens in `base.css` — don't hardcode
  colors. Dark mode is defined in three places that must move together:
  `:root[data-theme="dark"]`, `@media (prefers-color-scheme: dark)
  :root:not([data-theme="light"])`, and the inline `THEME_BOOTSTRAP` script
  that prevents a flash of the wrong theme.
- **JS**: vanilla, non-module, no dependencies. Behavior hooks off `data-*`
  attributes (`data-page`, `data-nav`, `data-year`, `data-theme-toggle`,
  `data-resonance-card`, `data-audio-preview`).
- **SEO**: every page needs a unique `<title>`, description, canonical, OG +
  Twitter tags, and the GA4 snippet (`G-LYY1V218NW`). `resonance.html` and all
  three sub-apps are intentionally `noindex, nofollow` — see "Resonance is
  unindexed by design" above before touching their meta tags.
- **Slugs**: lowercase-kebab, used as filename, JSON `slug`, and URL path.

## Local dev

```bash
python3 -m http.server 8000
```
Run from the repo root — pages use absolute `/assets/...` paths that depend on
it.

## Before claiming a change is done

- If you touched `content/` or the generator: rerun the build, then `git diff`
  the result — confirm Resonance's robots/nofollow output didn't change and
  nothing outside what you intended changed.
- If you touched `experiments/anlamazdin`: `npm test` and `npm run lint`.
- If you touched `experiments/sneak-peek` or `experiments/cuda-stack`:
  `npm run lint`.
- Load the changed page at `localhost:8000` in both light and dark theme.
- If you only touched documentation, none of the above applies — don't run
  the build just to "be safe."

## Don't

- Hand-edit generated HTML (`projects.html`, `research.html`, `resonance.html`,
  anything under `projects/` or `research/`).
- Hand-edit a `content/**/*.md` that has `content_source` set.
- Commit `node_modules/` or `experiments/*/dist/`.
- Publish gitignored local files (`Emrecan CV*.pdf`, `README.md`,
  `README 2.md`, `README 3.md`, `seo-audit-2026-04-12.md`).
- Run `--refresh-og-cover` unless explicitly asked.
- Commit or push without being asked.

## The README*.md trap

`README.md`, `README 2.md`, and `README 3.md` at the repo root are **not
documentation for this project** — they're downloaded copies of other repos'
READMEs (Rec-Dating, MBIB Quality Observatory, BABE RoBERTa baseline), kept
locally as source material and excluded from git. Don't read them expecting
project context. `PORTFOLIO.md` is the real project doc.
