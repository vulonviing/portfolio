from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://emrecanulu.com"
SOCIAL_IMAGE = f"{SITE_URL}/assets/img/og-cover.png"
AUTHOR = "Emrecan Ulu"
GA_ID = "G-LYY1V218NW"


HEADER_HTML = """
  <header class="site-header">
    <div class="container site-header__inner">
      <a href="/" class="site-header__brand">Emrecan Ulu</a>
      <div class="site-header__actions">
        <nav class="site-nav" aria-label="Primary">
          <ul>
            <li><a href="/" data-nav="home">Home</a></li>
            <li><a href="/about.html" data-nav="about">About</a></li>
            <li><a href="/projects.html" data-nav="projects">Projects</a></li>
            <li><a href="/research.html" data-nav="research">Research</a></li>
          </ul>
        </nav>
        <button class="theme-toggle" type="button" data-theme-toggle aria-label="Switch color theme"></button>
      </div>
    </div>
  </header>
""".strip()

FOOTER_HTML = """
  <footer class="site-footer">
    <div class="container site-footer__inner">
      <div>&copy; <span data-year></span> Emrecan Ulu. Munich, Germany.</div>
      <div>
        <a href="mailto:emrecanulu@outlook.com">Email</a>
        <a href="https://github.com/vulonviing" target="_blank" rel="noopener">GitHub</a>
        <a href="https://www.linkedin.com/in/emrecan-ulu/" target="_blank" rel="noopener">LinkedIn</a>
        <a href="https://medium.com/@emrecanulu" target="_blank" rel="noopener">Medium</a>
      </div>
    </div>
  </footer>
""".strip()

THEME_BOOTSTRAP = """
  <script>
    (function () {
      try {
        const savedTheme = localStorage.getItem("theme-preference");
        if (savedTheme === "light" || savedTheme === "dark") {
          document.documentElement.setAttribute("data-theme", savedTheme);
          document.documentElement.style.colorScheme = savedTheme;
        }
      } catch (err) {
        console.warn("Could not restore theme preference:", err);
      }
    })();
  </script>
""".strip()

GA_SNIPPET = f"""
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', '{GA_ID}');
  </script>
""".strip()

LIST_PAGE_CONFIG = {
    "projects": {
        "title": "Projects — Emrecan Ulu | Data Science & LLM Portfolio",
        "description": "Selected projects by Emrecan Ulu — RAG systems, LLM tools, applied machine learning, and end-to-end data science work.",
        "keywords": [
            "Emrecan Ulu projects",
            "Data Science portfolio",
            "LLM",
            "RAG",
            "BuildRAG",
            "Community Notes",
            "Machine Learning",
            "Python",
        ],
        "eyebrow": "Projects",
        "heading": "Things I've shipped.",
        "og_description": "Selected projects by Emrecan Ulu — RAG systems, LLM tools, and applied ML.",
    },
    "research": {
        "title": "Research — Emrecan Ulu | NLP, Networks, and Benchmarks",
        "description": "Research by Emrecan Ulu — language model fine-tuning, benchmark audits, network analysis, and reproducibility studies.",
        "keywords": [
            "Emrecan Ulu research",
            "BABE",
            "MBIB",
            "RoBERTa",
            "NLP",
            "Network Analysis",
            "Reproducibility",
            "Data Science",
        ],
        "eyebrow": "Research",
        "heading": "Studies, audits, and reproductions.",
        "og_description": "Language model fine-tuning, benchmark audits, network analysis, and reproducibility studies.",
    },
}


def load_index(section: str) -> list[dict]:
    return json.loads((ROOT / "content" / section / "_index.json").read_text(encoding="utf-8"))


def escape_attr(value: str) -> str:
    return html.escape(value, quote=True)


def restore_placeholders(text: str, placeholders: dict[str, str]) -> str:
    restored = text
    for _ in range(len(placeholders) + 1):
        updated = restored
        for key, fragment in placeholders.items():
            updated = updated.replace(key, fragment)
        if updated == restored:
            break
        restored = updated
    return restored


def parse_markdown_destination(destination: str) -> str:
    trimmed = html.unescape(destination).strip()
    if not trimmed:
        return ""

    if trimmed.startswith("<"):
        end = trimmed.find(">")
        if end != -1:
            return trimmed[1:end].strip()

    match = re.match(r"(\S+)", trimmed)
    if match:
        return match.group(1)
    return trimmed


def render_text_spans(text: str) -> str:
    escaped = html.escape(text, quote=False)
    placeholders: dict[str, str] = {}

    def stash(fragment: str) -> str:
        key = f"@@SPAN_{len(placeholders)}@@"
        placeholders[key] = fragment
        return key

    escaped = re.sub(
        r"`([^`]+)`",
        lambda match: stash(f"<code>{match.group(1)}</code>"),
        escaped,
    )
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", escaped)
    return restore_placeholders(escaped, placeholders)


def parse_inline(text: str) -> str:
    placeholders: dict[str, str] = {}

    def stash(fragment: str) -> str:
        key = f"@@INLINE_{len(placeholders)}@@"
        placeholders[key] = fragment
        return key

    text = re.sub(
        r"!\[([^\]]*)\]\(([^)]+)\)",
        lambda match: stash(
            f'<img src="{escape_attr(parse_markdown_destination(match.group(2)))}" '
            f'alt="{escape_attr(match.group(1).strip())}" loading="lazy" />'
        ),
        text,
    )
    escaped = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda match: stash(
            f'<a href="{escape_attr(parse_markdown_destination(match.group(2)))}">'
            f"{render_text_spans(match.group(1))}</a>"
        ),
        text,
    )
    return restore_placeholders(render_text_spans(escaped), placeholders)


def write_text_if_changed(path: Path, content: str) -> bool:
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def split_table_row(line: str) -> list[str]:
    row = line.strip()
    if row.startswith("|"):
        row = row[1:]
    if row.endswith("|"):
        row = row[:-1]
    return [cell.strip() for cell in row.split("|")]


def parse_table_alignment(line: str) -> list[str]:
    alignments = []
    for cell in split_table_row(line):
        stripped = cell.replace(" ", "")
        if stripped.startswith(":") and stripped.endswith(":"):
            alignments.append("center")
        elif stripped.endswith(":"):
            alignments.append("right")
        elif stripped.startswith(":"):
            alignments.append("left")
        else:
            alignments.append("")
    return alignments


def table_start(lines: list[str], idx: int) -> bool:
    if idx + 1 >= len(lines):
        return False
    if "|" not in lines[idx]:
        return False
    return bool(re.match(r"^\s*\|?[:\- ]+(?:\|[:\- ]+)+\|?\s*$", lines[idx + 1]))


def alignment_attr(alignments: list[str], idx: int) -> str:
    if idx < len(alignments) and alignments[idx]:
        return f' style="text-align:{alignments[idx]}"'
    return ""


def markdown_to_html(markdown: str) -> str:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    output: list[str] = []
    paragraph: list[str] = []
    list_type: str | None = None
    list_items: list[str] = []
    quote_lines: list[str] = []
    in_code = False
    code_lang = ""
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph
        if paragraph:
            text = " ".join(part.strip() for part in paragraph if part.strip())
            if text:
                output.append(f"<p>{parse_inline(text)}</p>")
        paragraph = []

    def flush_list() -> None:
        nonlocal list_type, list_items
        if list_type and list_items:
            items_html = "".join(f"<li>{item}</li>" for item in list_items)
            output.append(f"<{list_type}>{items_html}</{list_type}>")
        list_type = None
        list_items = []

    def flush_quote() -> None:
        nonlocal quote_lines
        if quote_lines:
            text = " ".join(line.strip() for line in quote_lines if line.strip())
            output.append(f"<blockquote><p>{parse_inline(text)}</p></blockquote>")
        quote_lines = []

    def flush_code() -> None:
        nonlocal in_code, code_lang, code_lines
        class_attr = f' class="language-{escape_attr(code_lang)}"' if code_lang else ""
        code_html = html.escape("\n".join(code_lines))
        output.append(f"<pre><code{class_attr}>{code_html}</code></pre>")
        in_code = False
        code_lang = ""
        code_lines = []

    idx = 0
    while idx < len(lines):
        line = lines[idx]
        stripped = line.strip()

        if in_code:
            if stripped.startswith("```"):
                flush_code()
            else:
                code_lines.append(line)
            idx += 1
            continue

        if stripped.startswith("```"):
            flush_paragraph()
            flush_list()
            flush_quote()
            in_code = True
            code_lang = stripped[3:].strip()
            code_lines = []
            idx += 1
            continue

        if not stripped:
            flush_paragraph()
            flush_list()
            flush_quote()
            idx += 1
            continue

        if table_start(lines, idx):
            flush_paragraph()
            flush_list()
            flush_quote()
            headers = split_table_row(lines[idx])
            alignments = parse_table_alignment(lines[idx + 1])
            body_rows: list[list[str]] = []
            idx += 2
            while idx < len(lines) and lines[idx].strip() and "|" in lines[idx]:
                body_rows.append(split_table_row(lines[idx]))
                idx += 1

            head_html = "".join(
                f"<th{alignment_attr(alignments, i)}>{parse_inline(cell)}</th>"
                for i, cell in enumerate(headers)
            )
            rows_html = []
            for row in body_rows:
                cells_html = "".join(
                    f"<td{alignment_attr(alignments, i)}>{parse_inline(cell)}</td>"
                    for i, cell in enumerate(row)
                )
                rows_html.append(f"<tr>{cells_html}</tr>")
            output.append(
                "<table>"
                f"<thead><tr>{head_html}</tr></thead>"
                f"<tbody>{''.join(rows_html)}</tbody>"
                "</table>"
            )
            continue

        if stripped.startswith("<"):
            flush_paragraph()
            flush_list()
            flush_quote()
            output.append(line)
            idx += 1
            continue

        heading_match = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading_match:
            flush_paragraph()
            flush_list()
            flush_quote()
            level = len(heading_match.group(1))
            output.append(f"<h{level}>{parse_inline(heading_match.group(2))}</h{level}>")
            idx += 1
            continue

        if re.match(r"^(-{3,}|\*{3,})$", stripped):
            flush_paragraph()
            flush_list()
            flush_quote()
            output.append("<hr />")
            idx += 1
            continue

        quote_match = re.match(r"^>\s?(.*)$", stripped)
        if quote_match:
            flush_paragraph()
            flush_list()
            quote_lines.append(quote_match.group(1))
            idx += 1
            continue

        list_match = re.match(r"^([-*]|\d+\.)\s+(.*)$", stripped)
        if list_match:
            flush_paragraph()
            flush_quote()
            marker = list_match.group(1)
            item_type = "ol" if marker.endswith(".") and marker[0].isdigit() else "ul"
            if list_type and list_type != item_type:
                flush_list()
            list_type = item_type
            list_items.append(parse_inline(list_match.group(2)))
            idx += 1
            continue

        if list_type:
            flush_list()

        paragraph.append(line)
        idx += 1

    if in_code:
        flush_code()
    flush_paragraph()
    flush_list()
    flush_quote()
    return "\n".join(output)


def build_schema(section: str, item: dict, canonical_url: str) -> str:
    schema_type = "TechArticle" if section == "projects" else "ScholarlyArticle"
    payload = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "headline": item["title"],
        "description": item["excerpt"],
        "author": {
            "@type": "Person",
            "name": AUTHOR,
            "url": f"{SITE_URL}/",
        },
        "mainEntityOfPage": canonical_url,
        "url": canonical_url,
        "image": SOCIAL_IMAGE,
        "keywords": item.get("tags", []),
        "publisher": {
            "@type": "Person",
            "name": AUTHOR,
        },
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_page(
    *,
    title: str,
    description: str,
    canonical_url: str,
    body_page: str,
    og_type: str,
    main_html: str,
    schema: str | None,
    keywords: Iterable[str] = (),
    og_description: str | None = None,
    robots: str = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
) -> str:
    keywords_content = ", ".join(keywords)
    social_description = og_description or description
    schema_block = (
        f'\n  <script type="application/ld+json">\n{schema}\n  </script>'
        if schema
        else ""
    )
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="shortcut icon" href="/assets/img/favicon.svg" />

  <title>{html.escape(title)}</title>
  <meta name="description" content="{escape_attr(description)}" />
  <meta name="author" content="{AUTHOR}" />
  <meta name="keywords" content="{escape_attr(keywords_content)}" />
  <meta name="robots" content="{escape_attr(robots)}" />
  <link rel="canonical" href="{escape_attr(canonical_url)}" />

  <meta property="og:type" content="{escape_attr(og_type)}" />
  <meta property="og:site_name" content="{AUTHOR}" />
  <meta property="og:title" content="{escape_attr(title)}" />
  <meta property="og:description" content="{escape_attr(social_description)}" />
  <meta property="og:url" content="{escape_attr(canonical_url)}" />
  <meta property="og:image" content="{SOCIAL_IMAGE}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Emrecan Ulu portfolio cover" />
  <meta property="og:locale" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{escape_attr(title)}" />
  <meta name="twitter:description" content="{escape_attr(social_description)}" />
  <meta name="twitter:image" content="{SOCIAL_IMAGE}" />
  <meta name="twitter:image:alt" content="Emrecan Ulu portfolio cover" />

{GA_SNIPPET}

{THEME_BOOTSTRAP}{schema_block}

  <link rel="stylesheet" href="/assets/css/base.css" />
  <link rel="stylesheet" href="/assets/css/layout.css" />
  <link rel="stylesheet" href="/assets/css/components.css" />
</head>
<body data-page="{escape_attr(body_page)}">
{HEADER_HTML}

  <main>
{main_html}
  </main>

{FOOTER_HTML}

  <script src="/assets/js/site.js"></script>
</body>
</html>
"""


def render_card(section: str, item: dict) -> str:
    tags_html = ""
    if item.get("tags"):
        tags_html = (
            '\n            <div class="tag-row">'
            + "".join(f"<span class=\"tag\">{html.escape(tag)}</span>" for tag in item["tags"])
            + "</div>"
        )

    repo_html = ""
    if item.get("repo"):
        repo_html = (
            f'\n              <a class="card__repo" href="{escape_attr(item["repo"])}" target="_blank" '
            f'rel="noopener noreferrer" aria-label="Open {escape_attr(item["title"])} on GitHub">GitHub</a>'
        )

    return f"""          <article class="card">
            <div class="card__meta">{html.escape(item.get("date", ""))}</div>
            <h2 class="card__title">
              <a class="card__title-link" href="/{section}/{item["slug"]}.html">{html.escape(item["title"])}</a>
            </h2>
            <p class="card__excerpt">{html.escape(item.get("excerpt", ""))}</p>{tags_html}
            <div class="card__actions">
              <a class="card__cta" href="/{section}/{item["slug"]}.html">Read more</a>{repo_html}
            </div>
          </article>
"""


def render_list_main(section: str, items: list[dict]) -> str:
    config = LIST_PAGE_CONFIG[section]
    cards_html = "\n".join(render_card(section, item).rstrip() for item in items)
    return f"""    <section class="list-page__header">
      <div class="container">
        <div class="section__eyebrow">{config["eyebrow"]}</div>
        <h1 class="section__title">{config["heading"]}</h1>
      </div>
    </section>

    <section class="section--tight">
      <div class="container">
        <div class="grid grid--2">
{cards_html}
        </div>
      </div>
    </section>
"""


def build_list_pages() -> None:
    for section, config in LIST_PAGE_CONFIG.items():
        items = load_index(section)
        canonical_url = f"{SITE_URL}/{section}.html"
        page = render_page(
            title=config["title"],
            description=config["description"],
            canonical_url=canonical_url,
            body_page=section,
            og_type="website",
            main_html=render_list_main(section, items),
            schema=None,
            keywords=config["keywords"],
            og_description=config["og_description"],
        )
        write_text_if_changed(ROOT / f"{section}.html", page)


def render_entry_main(section: str, item: dict, content_html: str) -> str:
    section_label = section.capitalize()
    repo_html = ""
    if item.get("repo"):
        repo_html = (
            f'\n          <a class="entry__repo" href="{escape_attr(item["repo"])}" '
            'target="_blank" rel="noopener noreferrer">View on GitHub</a>'
        )

    meta_text = section_label
    if item.get("date"):
        meta_text = f"{section_label} · {item['date']}"

    return f"""    <section class="entry">
      <div class="container">
        <div class="entry__actions">
          <a class="entry__back" href="/{section}.html">{section_label}</a>{repo_html}
        </div>
        <div class="entry__meta">{html.escape(meta_text)}</div>
      </div>
    </section>

    <section class="section--tight" style="padding-top: 24px;">
      <div class="container">
        <article class="prose">
{content_html}
        </article>
      </div>
    </section>
"""


def generate_entry_pages() -> list[tuple[str, Path]]:
    generated: list[tuple[str, Path]] = []
    for section in ("projects", "research"):
        items = load_index(section)
        output_dir = ROOT / section
        output_dir.mkdir(exist_ok=True)
        expected_files: set[str] = set()

        for item in items:
            markdown_path = ROOT / "content" / section / f'{item["slug"]}.md'
            html_content = markdown_to_html(markdown_path.read_text(encoding="utf-8"))
            canonical_url = f"{SITE_URL}/{section}/{item['slug']}.html"
            page_title = f'{item["title"]} — Emrecan Ulu'
            description = item["excerpt"]
            keywords = [item["title"], f"{section} by Emrecan Ulu", *item.get("tags", [])]
            main_html = render_entry_main(section, item, html_content)
            page = render_page(
                title=page_title,
                description=description,
                canonical_url=canonical_url,
                body_page=section,
                og_type="article",
                main_html=main_html,
                schema=build_schema(section, item, canonical_url),
                keywords=keywords,
            )
            output_path = output_dir / f'{item["slug"]}.html'
            write_text_if_changed(output_path, page)
            expected_files.add(output_path.name)
            generated.append((canonical_url, markdown_path))
        for existing in output_dir.glob("*.html"):
            if existing.name not in expected_files:
                existing.unlink()
    return generated


def build_sitemap(entry_sources: list[tuple[str, Path]]) -> None:
    pages: list[tuple[str, Path, str]] = [
        (f"{SITE_URL}/", ROOT / "index.html", "1.0"),
        (f"{SITE_URL}/about.html", ROOT / "about.html", "0.9"),
        (f"{SITE_URL}/projects.html", ROOT / "projects.html", "0.8"),
        (f"{SITE_URL}/research.html", ROOT / "research.html", "0.8"),
    ]
    pages.extend((url, source, "0.6") for url, source in entry_sources)

    chunks = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, _source, priority in pages:
        chunks.extend(
            [
                "  <url>",
                f"    <loc>{html.escape(url)}</loc>",
                "    <changefreq>monthly</changefreq>",
                f"    <priority>{priority}</priority>",
                "  </url>",
            ]
        )
    chunks.append("</urlset>")
    write_text_if_changed(ROOT / "sitemap.xml", "\n".join(chunks) + "\n")


def load_font(size: int, *, bold: bool = False):
    from PIL import ImageFont

    if bold:
        candidates = [
            ("/System/Library/Fonts/Helvetica.ttc", 1),
            ("/System/Library/Fonts/HelveticaNeue.ttc", 1),
            ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 0),
            ("/Library/Fonts/Arial Bold.ttf", 0),
        ]
    else:
        candidates = [
            ("/System/Library/Fonts/HelveticaNeue.ttc", 0),
            ("/System/Library/Fonts/Helvetica.ttc", 0),
            ("/System/Library/Fonts/SFNS.ttf", 0),
            ("/System/Library/Fonts/Supplemental/Arial.ttf", 0),
            ("/Library/Fonts/Arial.ttf", 0),
        ]

    for candidate, index in candidates:
        path = Path(candidate)
        if not path.exists():
            continue
        try:
            return ImageFont.truetype(str(path), size=size, index=index)
        except OSError:
            continue
    return ImageFont.load_default()


def build_og_cover() -> None:
    from PIL import Image, ImageDraw, ImageFilter

    width, height = 1200, 630
    base = Image.new("RGBA", (width, height), "#0c0f14")
    draw = ImageDraw.Draw(base)

    top = (14, 18, 24)
    bottom = (38, 44, 54)
    for y in range(height):
        t = y / (height - 1)
        color = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color, width=1)

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((760, -120, 1320, 300), fill=(54, 128, 255, 86))
    glow_draw.ellipse((-220, 430, 300, 820), fill=(255, 255, 255, 22))
    glow_draw.ellipse((420, 100, 980, 640), fill=(255, 255, 255, 10))
    glow = glow.filter(ImageFilter.GaussianBlur(58))
    base = Image.alpha_composite(base, glow)

    surface = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    surface_draw = ImageDraw.Draw(surface)
    surface_draw.rounded_rectangle(
        (68, 68, 1132, 562),
        radius=34,
        fill=(255, 255, 255, 14),
        outline=(255, 255, 255, 22),
        width=1,
    )
    surface = surface.filter(ImageFilter.GaussianBlur(0.6))
    base = Image.alpha_composite(base, surface)

    draw = ImageDraw.Draw(base)
    font_overline = load_font(24, bold=True)
    font_title = load_font(98, bold=False)
    font_body = load_font(31, bold=False)
    draw.text((112, 118), "EMRECAN ULU", font=font_overline, fill=(120, 182, 255))
    draw.text((112, 172), "Data Scientist", font=font_title, fill=(248, 249, 251))
    draw.multiline_text(
        (112, 312),
        "GenAI, LLM systems, and scalable data pipelines.\nPortfolio, projects, and research from Munich.",
        font=font_body,
        fill=(222, 226, 232),
        spacing=12,
    )

    output_path = ROOT / "assets" / "img" / "og-cover.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(output_path, format="PNG", optimize=True)


def main(argv: list[str]) -> int:
    refresh_og_cover = False
    if argv:
        if argv == ["--refresh-og-cover"]:
            refresh_og_cover = True
        else:
            print("Usage: python scripts/build_static_site.py [--refresh-og-cover]", file=sys.stderr)
            return 2

    build_list_pages()
    entry_sources = generate_entry_pages()
    build_sitemap(entry_sources)
    if refresh_og_cover:
        build_og_cover()
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
