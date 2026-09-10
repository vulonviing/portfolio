# Portfolio Site — emrecanulu.com

A static portfolio in plain HTML, CSS, and a tiny bit of JS.
Markdown drives the generated detail pages for Projects and Research.
Project entries can also be synced automatically from GitHub READMEs.

Live at <https://emrecanulu.com>.

This is the project's real documentation, checked into the repo. The
top-level `README.md`, `README 2.md`, and `README 3.md` files you may see
locally are **not** about this project — they're downloaded copies of other
repos' READMEs kept as source material, and they're gitignored. For AI-agent
working conventions (what's generated vs. hand-written, known drift, etc.),
see `AGENTS.md`.

## Run it locally

Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

To work on an experiment's source (Sneak Peek or Anlamazdın):

```bash
cd experiments/sneak-peek   # or experiments/anlamazdin
npm install
npm run dev
```

Anlamazdın also has a test suite: `npm test` (plus `npm run lint`). Sneak Peek
has `npm run lint` only.

## File map

```
.
├── index.html              Home / hero + featured projects
├── about.html              About me — pure HTML
├── projects.html           Generated projects list
├── research.html           Generated research list
├── resonance.html          Generated Resonance list (interactive experiences)
├── entry.html              Legacy redirect for old query-string entry URLs
├── projects/*.html         Generated static project detail pages
├── research/*.html         Generated static research detail pages
│
├── CNAME                   GitHub Pages custom domain
├── robots.txt              SEO crawler rules
├── sitemap.xml             SEO sitemap
├── scripts/
│   ├── build_static_site.py     Generates list/detail pages and sitemap
│   └── sync_github_readmes.py   Pulls README content from GitHub
├── anlamazdin/             Built static output for the Anlamazdın experience
├── sneak-peek/             Built static output for the Sneak Peek experiment
├── experiments/
│   ├── anlamazdin/         React/Vite source for the Anlamazdın experience
│   └── sneak-peek/         React/Vite source for the Sneak Peek experiment
│
├── partials/               Empty — no HTML include mechanism; shared header
│                           /footer markup is duplicated by hand across
│                           index.html, about.html, entry.html, and the
│                           generator's HEADER_HTML/FOOTER_HTML constants
│
├── assets/
│   ├── css/
│   │   ├── base.css        Variables, reset, typography (Helvetica Neue)
│   │   ├── layout.css      Container, header, footer, grid, sections
│   │   └── components.css  Hero, button, card, timeline, prose, resonance
│   ├── js/
│   │   ├── site.js         Active nav state, footer year, theme toggle,
│   │   │                   Resonance card hover-audio previews
│   │   └── entry.js        Redirects old entry.html?type=&slug= links
│   └── img/
│       ├── favicon.svg     Browser tab icon
│       └── og-cover.png    Social/share preview image
│
└── content/
    ├── projects/
    │   ├── _index.json     Ordered list of project cards
    │   └── *.md            One file per project
    ├── research/
    │   ├── _index.json     Ordered list of research cards
    │   └── *.md            One file per research entry
    └── resonance/
        └── _index.json     Ordered list of Resonance cards (no markdown —
                             each entry links out to a built experience)
```

## Update content

1. Create `content/projects/my-thing.md`.
2. Add an entry to `content/projects/_index.json`:

```json
{
  "slug": "my-thing",
  "title": "My Thing",
  "date": "April 2026",
  "excerpt": "One-sentence hook.",
  "tags": ["Python", "ML"]
}
```

3. Rebuild the static pages and sitemap:

```bash
python3 scripts/build_static_site.py
```

Same flow for `content/research/`.

Resonance cards work differently — `content/resonance/_index.json` has no
matching markdown, since each entry just links out to a built experience:

```json
{
  "slug": "my-thing",
  "title": "My Thing",
  "date": "2026 · Interactive",
  "excerpt": "One-sentence hook.",
  "tags": ["Web Audio", "Interactive"],
  "href": "/my-thing/",
  "visualTheme": "my-thing",
  "audioPreview": "my-thing"
}
```

`visualTheme` and `audioPreview` are hard-coded branches in
`render_resonance_card()` (`scripts/build_static_site.py`) and in
`setupResonanceCards()` (`assets/js/site.js`) — adding a genuinely new card
needs a small code change in both, not just the JSON entry.

## Auto-sync from GitHub README

If you want a project or research page to mirror the README in its GitHub repo, add
`content_source` to the matching entry in `content/projects/_index.json` or
`content/research/_index.json`:

```json
{
  "slug": "my-thing",
  "title": "My Thing",
  "date": "2026",
  "excerpt": "One-sentence hook.",
  "tags": ["Python", "ML"],
  "repo": "https://github.com/vulonviing/my-thing",
  "content_source": {
    "type": "github_readme",
    "branch": "main",
    "path": "README.md"
  }
}
```

Then run:

```bash
python3 scripts/sync_github_readmes.py
python3 scripts/build_static_site.py
```

The sync script:

- downloads the configured README from GitHub
- rewrites relative links and images to absolute GitHub URLs
- overwrites the matching `content/<section>/<slug>.md`

This repo also includes `.github/workflows/sync-readmes.yml`, which runs hourly and can
be triggered manually from GitHub Actions. That workflow syncs READMEs, rebuilds the
static pages, and commits the updated files back to the portfolio repo automatically.

If you want near-instant updates right after a push to a project repo, the same workflow
also accepts a `repository_dispatch` event with the type `sync-project-readmes`. That
lets a source repo trigger the portfolio sync immediately after its own `README.md`
changes.

## Experiments (Resonance)

`resonance.html` links out to standalone React + Vite experiences that live in
`experiments/<name>/` and build directly into the site root:

```js
// experiments/<name>/vite.config.js
export default defineConfig({
  base: '/<name>/',
  plugins: [react()],
  build: { outDir: '../../<name>', emptyOutDir: true },
});
```

Run `npm run build` inside the experiment folder, then commit the regenerated
`<name>/` directory at the repo root — that's what GitHub Pages serves. Built
output is checked in; `node_modules/` and `experiments/*/dist/` are
gitignored.

Both `anlamazdin/` and `sneak-peek/`, and `resonance.html` itself, are
intentionally `noindex, nofollow` — they're meant to be found by people, not
search engines or AI crawlers (see `robots.txt`, which also blocks GPTBot,
ClaudeBot, CCBot, PerplexityBot, and others from these paths specifically).
`scripts/build_static_site.py` doesn't currently reproduce all of these
`noindex`/`nofollow` details on a rebuild of `resonance.html` — see
`AGENTS.md` for the exact drift and the checklist to re-apply it if you
regenerate that page.

## SEO

Each public page has unique `<title>`, meta description, Open Graph and Twitter card tags,
canonical URL, and robots directives. The home page embeds `Person` schema and
generated detail pages embed article-style schema.

`sitemap.xml` and `robots.txt` are at the root. After deploying, submit the site
to Google Search Console and verify ownership.

`assets/img/og-cover.png` is a checked-in asset. It is not regenerated during the
hourly README sync. If you intentionally want to refresh it, run
`python3 scripts/build_static_site.py --refresh-og-cover`.

## Google Analytics

GA4 tag `G-LYY1V218NW` is wired into every page's `<head>`.

## Deploy (GitHub Pages + custom domain)

1. Push to <https://github.com/vulonviing/portfolio>.
2. In the GitHub repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / root**.
3. The `CNAME` file in this repo already declares `emrecanulu.com`.
4. At your DNS provider, add these records for `emrecanulu.com`:
   - `A` records pointing the apex `@` to GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A `CNAME` for `www` → `vulonviing.github.io.`
5. In **Settings → Pages**, enable **Enforce HTTPS** once the cert is issued.

## Customize

- **Colors / spacing / radii** — variables at the top of `assets/css/base.css`.
- **Navigation / footer** — edit the shared HTML inside the page templates and `scripts/build_static_site.py`.
- **Typography** — defaults to Helvetica Neue. Swap `--font-sans` if you want a different stack.
