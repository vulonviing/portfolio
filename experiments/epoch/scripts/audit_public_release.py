#!/usr/bin/env python3
"""Fail-closed audit for the publishable EPOCH snapshot and Portfolio repo."""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from anonymize import collect_sensitive_terms_from_data_dir, verify_public_tree


TABULAR = {
    "uc1": "uc1_enefg_threshold_check",
    "uc2": "uc2_ets1_scope_memo",
    "uc2-1": "uc2_1_ets1_scope_memo_annual",
    "uc3": "uc3_csrd_scope2_measure",
}
UC4_ID = "uc4_esrs_2026_impact"
SECRET_PATTERNS = {
    "private key": re.compile(rb"-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----"),
    "AWS key": re.compile(rb"AKIA[0-9A-Z]{16}"),
    "GitHub token": re.compile(rb"gh[pousr]_[A-Za-z0-9]{20,}"),
    "OpenAI key": re.compile(rb"sk-[A-Za-z0-9_-]{20,}"),
    "Google API key": re.compile(rb"AIza[0-9A-Za-z_-]{30,}"),
    "Slack token": re.compile(rb"xox[baprs]-[0-9A-Za-z-]{10,}"),
    "credential URL": re.compile(
        rb"(?i)(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis)://[^/\s:@]+:[^/\s@]+@"
    ),
    "local user path": re.compile(rb"/" + rb"Users/[^/\s\"']+/"),
    "Siemens internal domain": re.compile(
        rb"(?i)\b[A-Za-z0-9.-]+\.(?:siemens\.(?:com|net)|siemens-energy\.com)\b"
    ),
}


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thesis-root", required=True, type=Path)
    parser.add_argument(
        "--site-root",
        type=Path,
        default=Path(__file__).resolve().parents[3] / "epoch",
    )
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[3],
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def candidate_files(repo_root: Path) -> list[Path]:
    output = subprocess.check_output(
        ["git", "ls-files", "-co", "--exclude-standard", "-z"],
        cwd=repo_root,
    )
    return [repo_root / item.decode() for item in output.split(b"\0") if item]


def audit_repo(repo_root: Path, problems: list[str]) -> None:
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo_root).split(b"\0")
    tracked_names = {item.decode() for item in tracked if item}
    for name in sorted(tracked_names):
        lowered = name.lower()
        if lowered.endswith(".pyc") or "/node_modules/" in f"/{lowered}/":
            problems.append(f"generated file is tracked: {name}")
        if Path(name).name == ".env" or lowered.endswith((".pem", ".key", ".p12", ".pfx")):
            problems.append(f"private-looking file is tracked: {name}")

    for path in candidate_files(repo_root):
        try:
            data = path.read_bytes()
        except (OSError, IsADirectoryError):
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(data):
                problems.append(f"{label} pattern found in {path.relative_to(repo_root)}")


def audit_static_site(
    site_root: Path,
    data_terms: Any,
    problems: list[str],
) -> None:
    repo_root = site_root.parent
    data_root = site_root / "data"
    if (data_root / "registry-source.txt").exists():
        problems.append("raw registry-source.txt is publishable")
    public_registry = data_root / "registry-public.json"
    if not public_registry.exists():
        problems.append("registry-public.json is missing")
    else:
        for item in load_json(public_registry):
            registry_id = str(item.get("id", ""))
            terms = data_terms if registry_id in TABULAR.values() else type(data_terms)()
            verify_public_tree(item, registry_id, terms)

    summaries = load_json(data_root / "usecases.json")
    if {item.get("id") for item in summaries} != {*TABULAR.values(), UC4_ID}:
        problems.append("use-case registry is not exactly UC1, UC2, UC2.1, UC3, and UC4")

    for slug, registry_id in {**TABULAR, "uc4": UC4_ID}.items():
        case_root = data_root / "usecases" / slug
        detail = load_json(case_root / "detail.json")
        active = load_json(case_root / "active.json")
        terms = data_terms if slug in TABULAR else type(data_terms)()
        verify_public_tree(detail, registry_id, terms)
        verify_public_tree(active, registry_id, terms)

        dominant = active.get("run", {}).get("dominant_run_id")
        agent_runs = {
            record.get("run_id")
            for record in active.get("agents", {}).values()
            if isinstance(record, dict)
        }
        if active.get("run", {}).get("mixed") or agent_runs != {dominant}:
            problems.append(f"{slug} contains mixed-run agent records")

        document_files = {path.name for path in case_root.glob("*.json")} & {
            "corpus.json",
            "provisions.json",
        }
        expected = {"corpus.json", "provisions.json"} if slug == "uc4" else set()
        if document_files != expected:
            problems.append(f"{slug} has the wrong document-artifact surface")

    html_files = list(site_root.rglob("*.html"))
    if not html_files:
        problems.append("no pre-rendered HTML files found")
    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="ignore")
        if 'name="robots"' not in text or "noindex" not in text:
            problems.append(f"noindex missing from {path.relative_to(site_root)}")
        if not re.search(r'name="googlebot"[^>]*content="[^"]*noindex', text):
            problems.append(f"Googlebot noindex missing from {path.relative_to(site_root)}")
        if not re.search(r'name="bingbot"[^>]*content="[^"]*noindex', text):
            problems.append(f"Bingbot noindex missing from {path.relative_to(site_root)}")
        if 'rel="canonical"' not in text or "https://emrecanulu.com/epoch/" not in text:
            problems.append(f"canonical URL missing from {path.relative_to(site_root)}")

    maps = list(site_root.rglob("*.map"))
    if maps:
        problems.append(f"source maps are publishable: {len(maps)} file(s)")

    sitemap = (repo_root / "sitemap.xml").read_text(encoding="utf-8")
    if re.search(r"<loc>[^<]*/epoch(?:/|<)", sitemap, re.IGNORECASE):
        problems.append("EPOCH is discoverable through sitemap.xml")

    for path in repo_root.rglob("*.html"):
        if site_root in path.parents or "experiments" in path.parts or "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"href\s*=\s*[\"'][^\"']*/epoch(?:/|[\"'])", text, re.IGNORECASE):
            problems.append(f"public page links to EPOCH: {path.relative_to(repo_root)}")

    robots = (repo_root / "robots.txt").read_text(encoding="utf-8")
    general_rules = robots.split("User-agent: *", 1)[-1].split("User-agent:", 1)[0]
    if re.search(r"^Disallow:\s*/epoch/\s*$", general_rules, re.MULTILINE):
        problems.append("general crawlers cannot read EPOCH's noindex directive")
    for protected_path in ("/epoch/assets/", "/epoch/data/", "/experiments/epoch/"):
        if f"Disallow: {protected_path}" not in general_rules:
            problems.append(f"crawler protection missing for {protected_path}")

    app_source = site_root.parent / "experiments" / "epoch" / "src" / "api" / "client.ts"
    source_text = app_source.read_text(encoding="utf-8")
    if re.search(r"(?i)EventSource|WebSocket|127\.0\.0\.1|localhost|method\s*:\s*[\"'](?:POST|PUT|PATCH|DELETE)", source_text):
        problems.append("static client contains a backend or mutation transport")


def main() -> int:
    args = arguments()
    thesis_root = args.thesis_root.expanduser().resolve()
    site_root = args.site_root.expanduser().resolve()
    repo_root = args.repo_root.expanduser().resolve()
    sys.path.insert(0, str(thesis_root / "src"))
    from epoch_switch.config import DATA_DIR  # noqa: PLC0415

    problems: list[str] = []
    data_terms = collect_sensitive_terms_from_data_dir(DATA_DIR)
    try:
        audit_static_site(site_root, data_terms, problems)
    except (OSError, ValueError, KeyError, TypeError, RuntimeError) as exc:
        problems.append(f"static audit could not complete: {exc}")
    audit_repo(repo_root, problems)

    if problems:
        for problem in problems:
            print(f"FAIL: {problem}", file=sys.stderr)
        return 1
    print("Public-release privacy audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
