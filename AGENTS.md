# AGENTS.md

Project-specific context for working in this repo. Tool/workflow routing (which
skill, which agent, when to review) lives in `PLUGINS.md` — read that too.
Human-facing overview lives in `PORTFOLIO.md`.

## What this is

`emrecanulu.com` — a static personal portfolio. Plain HTML/CSS/vanilla JS at
the root, deployed via GitHub Pages (`CNAME`, `.nojekyll`, branch `main` /
root). No build step for the site itself. Two self-contained React + Vite
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

## ⚠️ Known generator drift — do not blindly trust a rebuild

Several hand-applied SEO edits were never written back into the generator.
Running the build today **regresses** them:

| Currently checked in | What the generator emits |
|---|---|
| `index.html`/`about.html` nav has `<a href="/resonance.html" rel="nofollow">` | `HEADER_HTML` has no `rel="nofollow"` |
| `resonance.html` `<head>` has `noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate` + `googlebot`/`bingbot` variants | `LIST_PAGE_CONFIG["resonance"]` passes no robots override → default `index, follow, …` |
| `resonance.html` card links carry `rel="nofollow"` | `render_resonance_card()` doesn't emit it |
| `sitemap.xml` has no `resonance.html` entry | `build_sitemap()` adds it at priority 0.8 |

This isn't accidental — `robots.txt` also blocks AI crawlers (GPTBot,
ClaudeBot, CCBot, PerplexityBot, …) from `/resonance.html`, `/anlamazdin/`,
`/sneak-peek/`. "Resonance is unindexed by design" is a deliberate choice; a
naive rebuild silently undoes it. The hourly sync workflow doesn't push this
regression (its commit scope excludes `resonance.html`), but a manual rebuild
will.

**Rule:** if you run the build, `git diff` the result before committing. If
the four rows above show up as changes, revert them by hand (or fix the
generator itself — that's a separate task, not something to do as a
side-effect of a content update).

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
anlamazdin/, sneak-peek/   Built output, committed, served by Pages
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
`audioPreview`) — but `visualTheme` and `audioPreview` are hard-coded branches
in `render_resonance_card()` (build script) and in `setupResonanceCards()`
(`assets/js/site.js`), so a genuinely new card needs code changes in both, not
just a JSON entry.

**Change nav or footer**
Edit `HEADER_HTML`/`FOOTER_HTML` in `scripts/build_static_site.py` *and* the
literal copies in `index.html`, `about.html`, `entry.html`. Missing one means
the site and the generator disagree on the next rebuild.

**Work on a sub-app**
```bash
cd experiments/<anlamazdin|sneak-peek>
npm install
npm run dev
```
To publish: `npm run build` writes directly into the site root's `<name>/`
directory (`vite.config.js` sets `outDir: '../../<name>'`,
`emptyOutDir: true`) — commit that directory. `anlamazdin` has tests
(`npm test` → `node --test` over `tests/*.test.js`) and `npm run lint`;
`sneak-peek` has `npm run lint` only, no tests.

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
  Twitter tags, and the GA4 snippet (`G-LYY1V218NW`). `resonance.html` and
  both sub-apps are intentionally `noindex, nofollow` — see the drift warning
  above before touching their meta tags.
- **Slugs**: lowercase-kebab, used as filename, JSON `slug`, and URL path.

## Local dev

```bash
python3 -m http.server 8000
```
Run from the repo root — pages use absolute `/assets/...` paths that depend on
it.

## Before claiming a change is done

- If you touched `content/` or the generator: rerun the build, then `git diff`
  the result — confirm the drift rows above didn't reappear and nothing
  outside what you intended changed.
- If you touched `experiments/anlamazdin`: `npm test` and `npm run lint`.
- If you touched `experiments/sneak-peek`: `npm run lint`.
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
