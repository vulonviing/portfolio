from __future__ import annotations

import json
import posixpath
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, urlsplit, urlunsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = "emrecanulu-portfolio-readme-sync/1.0"
MARKDOWN_LINK_RE = re.compile(r"(!?\[[^\]]*\])\(([^)]+)\)")
HTML_ATTR_RE = re.compile(r'(?P<attr>\b(?:src|href)=)(?P<quote>["\'])(?P<url>[^"\']+)(?P=quote)')


def load_index(section: str) -> list[dict]:
    index_path = ROOT / "content" / section / "_index.json"
    return json.loads(index_path.read_text(encoding="utf-8"))


def parse_github_repo(repo_url: str) -> tuple[str, str]:
    parsed = urlparse(repo_url)
    if parsed.netloc not in {"github.com", "www.github.com"}:
        raise ValueError(f"Unsupported repo host in {repo_url}")

    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) < 2:
        raise ValueError(f"Could not parse owner/repo from {repo_url}")

    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


def is_relative_target(target: str) -> bool:
    if not target:
        return False
    if target.startswith("#") or target.startswith("//") or target.startswith("/"):
        return False
    return not bool(urlparse(target).scheme)


def split_markdown_destination(destination: str) -> tuple[str, str, bool]:
    trimmed = destination.strip()
    if not trimmed:
        return "", "", False

    if trimmed.startswith("<"):
        end = trimmed.find(">")
        if end != -1:
            return trimmed[1:end], trimmed[end + 1 :], True

    match = re.match(r"(\S+)(.*)", trimmed)
    if not match:
        return "", "", False
    return match.group(1), match.group(2), False


def build_repo_url(owner: str, repo: str, branch: str, readme_path: str, target: str, is_image: bool) -> str:
    split_target = urlsplit(target)
    if not is_relative_target(split_target.path):
        return target

    base_dir = posixpath.dirname(readme_path)
    normalized_path = posixpath.normpath(posixpath.join(base_dir, split_target.path))
    if normalized_path.startswith("../"):
        return target

    if normalized_path == ".":
        normalized_path = ""

    if is_image:
        resolved = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{normalized_path}"
    else:
        resolved = f"https://github.com/{owner}/{repo}/blob/{branch}/{normalized_path}"

    return urlunsplit((urlsplit(resolved).scheme, urlsplit(resolved).netloc, urlsplit(resolved).path, split_target.query, split_target.fragment))


def rewrite_markdown_links(markdown: str, owner: str, repo: str, branch: str, readme_path: str) -> str:
    def replace(match: re.Match[str]) -> str:
        label = match.group(1)
        destination = match.group(2)
        target, suffix, was_wrapped = split_markdown_destination(destination)
        if not target:
            return match.group(0)

        updated = build_repo_url(owner, repo, branch, readme_path, target, is_image=label.startswith("!"))
        if updated == target:
            return match.group(0)

        rendered_target = f"<{updated}>" if was_wrapped else updated
        return f"{label}({rendered_target}{suffix})"

    return MARKDOWN_LINK_RE.sub(replace, markdown)


def rewrite_html_links(markdown: str, owner: str, repo: str, branch: str, readme_path: str) -> str:
    def replace(match: re.Match[str]) -> str:
        attr = match.group("attr")
        quote = match.group("quote")
        target = match.group("url")
        updated = build_repo_url(owner, repo, branch, readme_path, target, is_image=attr.startswith("src"))
        return f"{attr}{quote}{updated}{quote}"

    return HTML_ATTR_RE.sub(replace, markdown)


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/plain; charset=utf-8"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def sync_item(section: str, item: dict) -> str:
    content_source = item.get("content_source")
    if not isinstance(content_source, dict) or content_source.get("type") != "github_readme":
        return "skipped"

    repo_url = item.get("repo")
    if not isinstance(repo_url, str) or not repo_url:
        raise ValueError(f"{section}/{item.get('slug', '<unknown>')} is missing a repo URL")

    branch = content_source.get("branch", "main")
    readme_path = content_source.get("path", "README.md")
    if not isinstance(branch, str) or not branch:
        raise ValueError(f"{section}/{item['slug']} has an invalid branch")
    if not isinstance(readme_path, str) or not readme_path:
        raise ValueError(f"{section}/{item['slug']} has an invalid path")

    owner, repo = parse_github_repo(repo_url)
    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{readme_path}"

    markdown = fetch_text(raw_url)
    markdown = rewrite_markdown_links(markdown, owner, repo, branch, readme_path)
    markdown = rewrite_html_links(markdown, owner, repo, branch, readme_path)
    output_path = ROOT / "content" / section / f'{item["slug"]}.md'

    current = output_path.read_text(encoding="utf-8") if output_path.exists() else None
    if current == markdown:
        return "unchanged"

    output_path.write_text(markdown.rstrip() + "\n", encoding="utf-8")
    return "updated"


def sync_section(section: str) -> tuple[int, int, int]:
    updated = 0
    unchanged = 0
    skipped = 0

    for item in load_index(section):
        state = sync_item(section, item)
        slug = item.get("slug", "<unknown>")
        print(f"[{section}] {slug}: {state}")
        if state == "updated":
            updated += 1
        elif state == "unchanged":
            unchanged += 1
        else:
            skipped += 1

    return updated, unchanged, skipped


def main(argv: list[str]) -> int:
    sections = argv or ["projects", "research"]
    allowed_sections = {"projects", "research"}
    invalid = [section for section in sections if section not in allowed_sections]
    if invalid:
        print(f"Unsupported section(s): {', '.join(invalid)}", file=sys.stderr)
        return 2

    total_updated = 0
    total_unchanged = 0
    total_skipped = 0

    try:
        for section in sections:
            updated, unchanged, skipped = sync_section(section)
            total_updated += updated
            total_unchanged += unchanged
            total_skipped += skipped
    except (HTTPError, URLError, ValueError) as exc:
        print(f"README sync failed: {exc}", file=sys.stderr)
        return 1

    print(
        "Summary: "
        f"{total_updated} updated, "
        f"{total_unchanged} unchanged, "
        f"{total_skipped} skipped"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
