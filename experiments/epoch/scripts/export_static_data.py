#!/usr/bin/env python3
"""Export one coherent, anonymized EPOCH example per use case."""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from anonymize import (
    PrivacyError,
    SensitiveTerms,
    Tokenizer,
    anonymize,
    collect_sensitive_terms,
    collect_sensitive_terms_from_data_dir,
    verify_public_tree,
)

SLUGS = {"1": "uc1", "2": "uc2", "2.1": "uc2-1", "3": "uc3", "4": "uc4"}
TOPOLOGIES = ("Direct", "Debate", "Coalition")
FAMILIES = ("tabular", "document")


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--thesis-root", required=True, type=Path)
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "public" / "data",
    )
    return parser.parse_args()


def _write_json(path: Path, value: Any) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")
    return len(text.encode("utf-8"))


def _write_text(path: Path, value: str) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")
    return len(value.encode("utf-8"))


def _started_at(run_id: str) -> str | None:
    try:
        stamp = datetime.strptime(run_id[:18], "%Y-%m-%d_%H%M%SZ")
    except ValueError:
        return None
    return stamp.replace(tzinfo=timezone.utc).isoformat()


def _flatten_agent_ids(ranks: list[Any]) -> set[str]:
    ids: set[str] = set()
    for rank in ranks:
        entries = rank.get("agents", []) if isinstance(rank, dict) else rank
        for item in entries:
            if isinstance(item, dict) and item.get("agent_id"):
                ids.add(str(item["agent_id"]).lower())
    return ids


def _selected_example(
    active: dict[str, Any], family: str, output_binding_for: Any
) -> tuple[dict[str, Any], str]:
    terminal_key = "f2" if family == "document" else "f1"
    terminal = active.get(terminal_key)
    if not isinstance(terminal, dict) or not terminal.get("run_id"):
        raise RuntimeError(f"No active {terminal_key.upper()} example is available")
    run_id = str(terminal["run_id"])
    scoped = {
        key: record
        if isinstance(record, dict) and str(record.get("run_id")) == run_id
        else None
        for key, record in active.items()
    }

    if family == "document":
        required = {
            "rc1_1", "rc1_2", "rm1_1", "rm1_2", "rd3", "cp1", "ts",
            "p4", "p5", "p6", "f2", "ex1", "ex2",
        }
    else:
        required = {"r1", "da1", "r2", "d1", "d2", "cp1", "ts", "d3", "f1", "ex1", "ex2"}
        topology = str(scoped["ts"]["payload"]["selected_topology_id"])
        binding = output_binding_for(topology, family=family)
        required |= _flatten_agent_ids(binding.get("ranks", []))

    missing = sorted(key for key in required if not scoped.get(key))
    if missing:
        raise RuntimeError(
            f"Example {run_id} is missing required same-run records: {', '.join(missing)}"
        )
    return scoped, run_id


def _collect_terms_from_shelves(thesis_root: Path, registry_id: str) -> SensitiveTerms:
    terms = SensitiveTerms()
    roots = [
        thesis_root / "src" / "epoch_switch" / "agents",
        thesis_root / "experiments" / "real",
    ]
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*.json"):
            if registry_id not in path.parts and root.name != "real":
                continue
            try:
                value = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            encoded = json.dumps(value, ensure_ascii=False)
            if registry_id not in path.parts and registry_id not in encoded:
                continue
            collect_sensitive_terms(value, terms)
    return terms


def _merge_terms(target: SensitiveTerms, source: SensitiveTerms) -> None:
    target.sites.update(source.sites)
    target.identity.update(source.identity)
    target.geography.update(source.geography)
    target.business.update(source.business)
    target.people.update(source.people)
    target.measurements.update(source.measurements)


def main() -> int:
    args = _arguments()
    thesis_root = args.thesis_root.expanduser().resolve()
    if not (thesis_root / "src" / "epoch_switch").is_dir():
        raise SystemExit("--thesis-root does not contain src/epoch_switch")

    sys.path.insert(0, str(thesis_root / "src"))
    from epoch_switch.regulation_cli import (  # noqa: PLC0415
        load_active_set,
        load_document_active_set,
        load_document_corpus_artifacts,
        load_document_provision_texts,
    )
    from epoch_switch.config import DATA_DIR  # noqa: PLC0415
    from epoch_switch.selection.stage2_binding import output_binding_for  # noqa: PLC0415
    from epoch_switch.selection.topology_library import LAMBDA, list_topologies  # noqa: PLC0415
    from epoch_switch.usecases.registry import list_usecases  # noqa: PLC0415
    from epoch_switch.webapi.serializers import (  # noqa: PLC0415
        serialize_active_set,
        serialize_stage2_binding,
        serialize_topology_library,
        serialize_usecase_detail,
        serialize_usecase_list,
    )

    usecases = list_usecases()
    raw_sets: dict[str, dict[str, Any]] = {}
    run_ids: dict[str, str] = {}
    terms_by_registry: dict[str, SensitiveTerms] = {}
    tokenizers: dict[str, Tokenizer] = {}
    configured_data_terms = collect_sensitive_terms_from_data_dir(DATA_DIR)

    for _, seed in usecases:
        family = "document" if seed.pipeline_family == "document" else "tabular"
        raw = load_document_active_set(seed.id) if family == "document" else load_active_set(seed.id)
        scoped, run_id = _selected_example(raw, family, output_binding_for)
        raw_sets[seed.id] = scoped
        run_ids[seed.id] = run_id
        terms = _collect_terms_from_shelves(thesis_root, seed.id)
        if family == "tabular":
            _merge_terms(terms, configured_data_terms)
        collect_sensitive_terms(raw, terms)
        terms_by_registry[seed.id] = terms
        tokenizers[seed.id] = Tokenizer()

    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix="epoch-data-", dir=output.parent))
    total_bytes = 0
    try:
        summaries = serialize_usecase_list()
        masked_summaries = [
            anonymize(
                item,
                item["id"],
                terms_by_registry[item["id"]],
                tokenizer=tokenizers[item["id"]],
            )
            for item in summaries
        ]
        total_bytes += _write_json(staging / "usecases.json", masked_summaries)

        public_registry = []
        for _, seed in usecases:
            public_registry.append(
                anonymize(
                    serialize_usecase_detail(seed),
                    seed.id,
                    terms_by_registry[seed.id],
                    tokenizer=tokenizers[seed.id],
                )
            )
        total_bytes += _write_text(
            staging / "registry-public.json",
            json.dumps(public_registry, ensure_ascii=False, indent=2) + "\n",
        )

        total_bytes += _write_json(staging / "topology" / "library.json", serialize_topology_library())
        for topology in TOPOLOGIES:
            for family in FAMILIES:
                total_bytes += _write_json(
                    staging / "topology" / topology / f"stage2-{family}.json",
                    serialize_stage2_binding(topology, family),
                )

        for key, seed in usecases:
            slug = SLUGS[key]
            terms = terms_by_registry[seed.id]
            detail = anonymize(
                serialize_usecase_detail(seed),
                seed.id,
                terms,
                tokenizer=tokenizers[seed.id],
            )
            active_payload = {
                "registry_id": seed.id,
                "pipeline_family": seed.pipeline_family,
                "ready": True,
                "agents": serialize_active_set(raw_sets[seed.id]),
                "run": {
                    "source": "example",
                    "run_dir": run_ids[seed.id],
                    "started_at": _started_at(run_ids[seed.id]),
                    "run_ids": [run_ids[seed.id]],
                    "mixed": False,
                    "dominant_run_id": run_ids[seed.id],
                },
            }
            masked_active = anonymize(
                active_payload,
                seed.id,
                terms,
                tokenizer=tokenizers[seed.id],
            )
            verify_public_tree(detail, seed.id, terms)
            verify_public_tree(masked_active, seed.id, terms)
            total_bytes += _write_json(staging / "usecases" / slug / "detail.json", detail)
            total_bytes += _write_json(staging / "usecases" / slug / "active.json", masked_active)

            if seed.pipeline_family == "document":
                corpus = load_document_corpus_artifacts(seed.id, run_ids[seed.id])
                provisions = load_document_provision_texts(seed.id)
                total_bytes += _write_json(staging / "usecases" / slug / "corpus.json", corpus)
                total_bytes += _write_json(staging / "usecases" / slug / "provisions.json", provisions)

        if output.exists():
            shutil.rmtree(output)
        staging.replace(output)
        print(f"Exported five single-run examples ({total_bytes:,} bytes) to {output}")
        print("Privacy verification passed.")
        return 0
    except (PrivacyError, RuntimeError) as exc:
        print(f"Export blocked: {exc}", file=sys.stderr)
        return 1
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == "__main__":
    raise SystemExit(main())
