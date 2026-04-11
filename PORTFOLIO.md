# Portfolio Site — emrecanulu.com

A static, Apple-style portfolio in plain HTML, CSS, and a tiny bit of JS.
Markdown drives the Projects and Research pages — write a `.md`, register it
in `_index.json`, and it shows up.

Live at <https://emrecanulu.com>.

## Run it locally

Browsers block `fetch()` on `file://` URLs, so serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## File map

```
.
├── index.html              Home / hero + featured projects
├── about.html              About me — pure HTML
├── projects.html           Projects list (loads from content/projects/_index.json)
├── research.html           Research list (loads from content/research/_index.json)
├── entry.html              Universal markdown viewer (?type=&slug=)
│
├── CNAME                   GitHub Pages custom domain
├── robots.txt              SEO crawler rules
├── sitemap.xml             SEO sitemap
│
├── partials/
│   ├── header.html         Site nav (injected on every page)
│   └── footer.html         Site footer (injected on every page)
│
├── assets/
│   ├── css/
│   │   ├── base.css        Variables, reset, typography (Helvetica Neue)
│   │   ├── layout.css      Container, header, footer, grid, sections
│   │   └── components.css  Hero, button, card, timeline, prose
│   ├── js/
│   │   ├── site.js         Header/footer injection + active nav state
│   │   ├── list.js         Renders project/research grids from _index.json
│   │   └── entry.js        Loads a single .md into entry.html + dynamic SEO
│   └── img/                Drop og-cover.png here for social previews
│
└── content/
    ├── projects/
    │   ├── _index.json     Ordered list of project cards
    │   └── *.md            One file per project
    └── research/
        ├── _index.json     Ordered list of research cards
        └── *.md            One file per research entry
```

## Add a project

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

That's it. Same flow for `content/research/`.

## SEO

Each page has unique `<title>`, meta description, Open Graph and Twitter card tags,
canonical URL, and robots directives. The home page also embeds a JSON-LD
`Person` schema so Google can build a knowledge-graph entry for "Emrecan Ulu".

`sitemap.xml` and `robots.txt` are at the root. After deploying, submit the site
to Google Search Console and verify ownership.

To improve social previews, drop a 1200×630 PNG at `assets/img/og-cover.png`.

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
- **Navigation** — `partials/header.html`.
- **Footer links** — `partials/footer.html`.
- **Typography** — defaults to Helvetica Neue. Swap `--font-sans` if you want a different stack.
