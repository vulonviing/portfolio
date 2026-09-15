"""Deterministic privacy transform for the public EPOCH snapshot."""
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

MASK = "****"

TABULAR_REGISTRY_IDS = {
    "uc1_enefg_threshold_check",
    "uc2_ets1_scope_memo",
    "uc2_1_ets1_scope_memo_annual",
    "uc3_csrd_scope2_measure",
}

SITE_KEYS = {"location_id", "location_name"}
BUSINESS_KEYS = {
    "bu_rc",
    "bu_rc_group",
    "bu_rc_name",
    "bu_rc_id",
    "bu_rc_code",
    "business_unit",
    "division",
    "plant",
    "plant_name",
}
IDENTITY_KEYS = {
    "address",
    "city",
    "zip_code",
    "latitude",
    "longitude",
    "location_city",
}
GEOGRAPHY_KEYS = {
    "country",
    "country_name",
    "country_code",
    "location_country",
    "cdp_region",
    "region_name",
}
PERSON_KEYS = {"approved_by", "reviewer", "reviewed_by", "decided_by", "user"}
MEASUREMENT_KEYS = {
    "gap",
    "threshold",
    "value",
    "consumption",
    "average",
    "avg_3yr",
    "subtotal_t",
    "portfolio_total_t",
    "deterministic_portfolio_total_t",
    "method_a",
    "method_b",
    "method_figure",
    "abs_delta",
    "pct_diff",
    "evidence_completeness",
}
MEASUREMENT_SUFFIXES = ("_kwh", "_mwh", "_gwh", "_tco2e", "_t")
DATA_COUNT_KEYS = {
    "row_count",
    "column_count",
    "null_count",
    "unique_count",
    "site_count",
    "division_count",
}
DATA_RESULT_AGENTS = {"d1", "d2", "d3", "p1", "p2", "p3", "s1", "c1", "c2", "f1"}
PROSE_KEYS = {
    "interpretation",
    "carried_caveats",
    "rationale",
    "summary",
    "finding_text",
    "narrative",
    "entry_text",
    "provenance_note",
    "headline",
    "location_display",
}
RESULT_PROSE_KEYS = PROSE_KEYS | {
    "defensibility",
    "materiality_verdict",
    "delta_interpretation",
    "reconciled_conclusion",
    "scope_determination",
    "article_grounding",
    "method_a_grounding",
    "method_b_grounding",
    "grounding",
    "body",
    "limitations",
    "data_volume_coverage_note",
    "readiness_assessment",
}

UNIT_NUMBER_RE = re.compile(
    r"(?<!\w)[+-]?[\d][\d,.]*\s*(?:GWh|MWh|kWh|tCO₂e|tCO2e)(?!\w)",
    re.IGNORECASE,
)
COORD_RE = re.compile(r"(?<![\d:])[+-]?\d{1,3}\.\d{3,}(?!\d)")
POSTAL_RE = re.compile(r"\b\d{5}\s+[A-ZÄÖÜ][\w\-.\s]{1,40}")
RESULT_DECIMAL_RE = re.compile(r"(?<![\w-])[+-]?\d+\.\d+(?![\w-])")
RESULT_PERCENT_RE = re.compile(r"(?<![\w-])[+-]?\d+(?:\.\d+)?\s*%(?!\w)")
RESULT_COUNT_RE = re.compile(
    r"(?<![\w-])\d[\d,]*(?=\s+(?:sites?|rows?|records?|entries|divisions?|locations?|flags?|findings?)\b)",
    re.IGNORECASE,
)
RESULT_NUMBER_RE = re.compile(r"(?<![\w-])[+-]?\d[\d,]*(?![\w-])")
NUMBER_RE = re.compile(r"^[+-]?[\d][\d,.]*$")
ISO_DATETIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")
COMPANY_RE = re.compile(r"\bSiemens[\w-]*(?:\s+AG)?\b", re.IGNORECASE)


def _measurement_key(key: str, path: tuple[str, ...]) -> bool:
    lowered = key.lower()
    if "catalog_snapshot" in path:
        return False
    if lowered == "value" and any(part in {"filters", "time_window"} for part in path):
        return False
    return (
        lowered in MEASUREMENT_KEYS
        or lowered.startswith("total_")
        or lowered.endswith(MEASUREMENT_SUFFIXES)
    )


def _scalar_values(value: Any) -> Iterable[Any]:
    if isinstance(value, dict):
        candidate = value.get("values")
        if candidate is not None:
            yield from _scalar_values(candidate)
    elif isinstance(value, list):
        for item in value:
            yield from _scalar_values(item)
    elif value is not None:
        yield value


@dataclass
class Tokenizer:
    tables: dict[str, dict[str, str]] = field(default_factory=dict)

    def token(self, kind: str, value: Any) -> str:
        table = self.tables.setdefault(kind, {})
        raw = str(value).strip()
        if raw not in table:
            table[raw] = f"{kind}-{len(table) + 1:02d}"
        return table[raw]


@dataclass
class SensitiveTerms:
    identity: set[str] = field(default_factory=set)
    geography: set[str] = field(default_factory=set)
    business: set[str] = field(default_factory=set)
    people: set[str] = field(default_factory=set)
    measurements: set[str] = field(default_factory=set)
    _compiled_prose_pattern: re.Pattern[str] | None = field(
        default=None, init=False, repr=False
    )

    @property
    def prose_terms(self) -> list[str]:
        terms = self.identity | self.geography | self.business | self.people
        return sorted((term for term in terms if term), key=len, reverse=True)

    @property
    def prose_pattern(self) -> re.Pattern[str] | None:
        if self._compiled_prose_pattern is None:
            terms = self.prose_terms
            if terms:
                alternatives = "|".join(re.escape(term) for term in terms)
                self._compiled_prose_pattern = re.compile(
                    rf"(?<!\w)(?:{alternatives})(?!\w)", re.IGNORECASE
                )
        return self._compiled_prose_pattern


def collect_sensitive_terms(
    value: Any,
    terms: SensitiveTerms,
    *,
    key: str | None = None,
    path: tuple[str, ...] = (),
) -> None:
    """Collect source literals before masking so embedded prose can be scrubbed."""
    lowered = (key or "").lower()
    if lowered in SITE_KEYS | IDENTITY_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if len(text) >= 5:
                terms.identity.add(text)
    elif lowered in GEOGRAPHY_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if len(text) >= 2:
                terms.geography.add(text)
    elif lowered in BUSINESS_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if text:
                terms.business.add(text)
    elif lowered in PERSON_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if len(text) >= 3:
                terms.people.add(text)
    elif key and _measurement_key(key, path):
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            digits = sum(ch.isdigit() for ch in text)
            if digits >= 4 or ("." in text and digits >= 3):
                terms.measurements.add(text)

    if isinstance(value, dict):
        for child_key, child in value.items():
            collect_sensitive_terms(
                child, terms, key=child_key, path=(*path, lowered) if lowered else path
            )
    elif isinstance(value, list):
        for child in value:
            collect_sensitive_terms(child, terms, key=key, path=path)


def collect_sensitive_terms_from_data_dir(data_dir: Path) -> SensitiveTerms:
    """Collect denylisted literals from the configured confidential data root."""
    terms = SensitiveTerms()
    if not data_dir.is_dir():
        return terms
    for source in data_dir.iterdir():
        try:
            if source.suffix.lower() == ".csv":
                with source.open(newline="", encoding="utf-8-sig") as handle:
                    for row in csv.DictReader(handle):
                        collect_sensitive_terms(row, terms)
            elif source.suffix.lower() == ".json":
                collect_sensitive_terms(
                    json.loads(source.read_text(encoding="utf-8")), terms
                )
        except (OSError, csv.Error, json.JSONDecodeError):
            continue
    return terms


def _replace_terms(text: str, terms: SensitiveTerms) -> str:
    pattern = terms.prose_pattern
    return pattern.sub(MASK, text) if pattern else text


def scrub_prose(
    text: str,
    terms: SensitiveTerms,
    *,
    tabular: bool,
    mask_result_numbers: bool = False,
) -> str:
    cleaned = _replace_terms(text, terms)
    if tabular:
        cleaned = COMPANY_RE.sub("the company", cleaned)
        cleaned = UNIT_NUMBER_RE.sub(MASK, cleaned)
        if not ISO_DATETIME_RE.match(cleaned):
            cleaned = POSTAL_RE.sub(MASK, cleaned)
            cleaned = COORD_RE.sub(MASK, cleaned)
        if mask_result_numbers:
            cleaned = RESULT_PERCENT_RE.sub(MASK, cleaned)
            cleaned = RESULT_DECIMAL_RE.sub(MASK, cleaned)
            cleaned = RESULT_COUNT_RE.sub(MASK, cleaned)
            cleaned = RESULT_NUMBER_RE.sub(MASK, cleaned)
    return cleaned


def _data_result_path(path: tuple[str, ...]) -> bool:
    lowered = tuple(part.lower() for part in path)
    if "agents" not in lowered or "payload" not in lowered:
        return False
    agent_index = lowered.index("agents") + 1
    return agent_index < len(lowered) and lowered[agent_index] in DATA_RESULT_AGENTS


def _data_count_key(key: str, path: tuple[str, ...]) -> bool:
    lowered = key.lower()
    parents = {part.lower() for part in path}
    if "catalog_snapshot" in parents and lowered in DATA_COUNT_KEYS:
        return True
    if "quality_summary" in parents and "status" in parents:
        return True
    return "payload" in parents and (
        lowered in DATA_COUNT_KEYS or lowered.startswith("n_")
    )


def _map_nested_values(value: Any, transform: Any) -> Any:
    if isinstance(value, list):
        return [_map_nested_values(item, transform) for item in value]
    if isinstance(value, dict):
        return {
            child_key: (
                _map_nested_values(child, transform)
                if child_key == "values"
                else child
            )
            for child_key, child in value.items()
        }
    if value is None:
        return value
    return transform(value)


def anonymize(
    value: Any,
    registry_id: str,
    terms: SensitiveTerms,
    *,
    tokenizer: Tokenizer | None = None,
    key: str | None = None,
    path: tuple[str, ...] = (),
) -> Any:
    tabular = registry_id in TABULAR_REGISTRY_IDS
    tokenizer = tokenizer or Tokenizer()
    lowered = (key or "").lower()

    if lowered in PERSON_KEYS:
        return _map_nested_values(value, lambda _: MASK)

    if tabular and lowered in SITE_KEYS:
        return _map_nested_values(value, lambda item: tokenizer.token("site", item))
    if tabular and lowered in BUSINESS_KEYS:
        return _map_nested_values(value, lambda item: tokenizer.token("bu", item))
    if tabular and lowered in GEOGRAPHY_KEYS:
        return _map_nested_values(value, lambda item: tokenizer.token("geo", item))
    if tabular and lowered in IDENTITY_KEYS:
        return _map_nested_values(value, lambda _: MASK)
    if tabular and key and (
        _measurement_key(key, path) or _data_count_key(key, path)
    ):
        if isinstance(value, (int, float)) or (
            isinstance(value, str) and NUMBER_RE.fullmatch(value.strip())
        ):
            return MASK
    if tabular and "catalog_snapshot" in path and isinstance(value, (int, float)) and not isinstance(value, bool):
        return MASK

    if isinstance(value, dict):
        filter_column = str(value.get("column", "")).lower() if tabular else ""
        transformed: dict[str, Any] = {}
        for child_key, child in value.items():
            if child_key in {"value", "values"} and filter_column in BUSINESS_KEYS:
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("bu", item)
                )
            elif child_key in {"value", "values"} and filter_column in SITE_KEYS:
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("site", item)
                )
            elif child_key in {"value", "values"} and filter_column in GEOGRAPHY_KEYS:
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("geo", item)
                )
            elif child_key in {"value", "values"} and filter_column in IDENTITY_KEYS:
                transformed[child_key] = _map_nested_values(child, lambda _: MASK)
            elif (
                child_key in {"value", "values"}
                and filter_column
                and "catalog_snapshot" in path
            ):
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("category", item)
                )
            else:
                transformed[child_key] = anonymize(
                    child,
                    registry_id,
                    terms,
                    tokenizer=tokenizer,
                    key=child_key,
                    path=(*path, lowered) if lowered else path,
                )
        return transformed
    if isinstance(value, list):
        return [
            anonymize(
                child,
                registry_id,
                terms,
                tokenizer=tokenizer,
                key=key,
                path=path,
            )
            for child in value
        ]
    if isinstance(value, str) and tabular:
        raw = value.strip()
        if raw in terms.business:
            return tokenizer.token("bu", raw)
        if raw in terms.geography:
            return tokenizer.token("geo", raw)
        if raw in terms.identity:
            return MASK
        if "selectable_filters" in path or "available_date_range" in path:
            return tokenizer.token("category", raw)
        return scrub_prose(
            value,
            terms,
            tabular=True,
            mask_result_numbers=(
                _data_result_path(path)
                and (lowered in RESULT_PROSE_KEYS or len(value) >= 80)
            ),
        )
    if isinstance(value, str) and (
        lowered in PROSE_KEYS or len(value) >= 80
    ):
        return scrub_prose(value, terms, tabular=tabular)
    return value


class PrivacyError(RuntimeError):
    """Raised when a sensitive value survives the public transform."""


def verify_public_tree(
    value: Any,
    registry_id: str,
    terms: SensitiveTerms,
    *,
    key: str | None = None,
    path: tuple[str, ...] = (),
) -> None:
    tabular = registry_id in TABULAR_REGISTRY_IDS
    lowered = (key or "").lower()
    location = ".".join(path) or "$"

    if lowered in PERSON_KEYS:
        for scalar in _scalar_values(value):
            if scalar != MASK:
                raise PrivacyError(f"person field survived at {location}.{lowered}")
    if tabular and lowered in SITE_KEYS:
        for scalar in _scalar_values(value):
            if not isinstance(scalar, str) or not re.fullmatch(r"site-\d+", scalar):
                raise PrivacyError(f"site identity survived at {location}.{lowered}")
    if tabular and lowered in BUSINESS_KEYS:
        for scalar in _scalar_values(value):
            if not isinstance(scalar, str) or not re.fullmatch(r"bu-\d+", scalar):
                raise PrivacyError(f"business identity survived at {location}.{lowered}")
    if tabular and lowered in GEOGRAPHY_KEYS:
        for scalar in _scalar_values(value):
            if not isinstance(scalar, str) or not re.fullmatch(r"geo-\d+", scalar):
                raise PrivacyError(f"geography survived at {location}.{lowered}")
    if tabular and lowered in IDENTITY_KEYS:
        for scalar in _scalar_values(value):
            if scalar != MASK:
                raise PrivacyError(f"location field survived at {location}.{lowered}")
    if tabular and key and (
        _measurement_key(key, path) or _data_count_key(key, path)
    ):
        if isinstance(value, (int, float)) or (
            isinstance(value, str) and NUMBER_RE.fullmatch(value.strip())
        ):
            raise PrivacyError(f"measurement survived at {location}.{lowered}")
    if tabular and "catalog_snapshot" in path and isinstance(value, (int, float)) and not isinstance(value, bool):
        raise PrivacyError(f"catalog number survived at {location}.{lowered}")

    if isinstance(value, dict):
        filter_column = str(value.get("column", "")).lower() if tabular else ""
        filter_values = value.get("values", value.get("value"))
        if filter_column in BUSINESS_KEYS:
            for scalar in _scalar_values(filter_values):
                if not isinstance(scalar, str) or not re.fullmatch(r"bu-\d+", scalar):
                    raise PrivacyError(f"business filter survived at {location}")
        if filter_column in SITE_KEYS:
            for scalar in _scalar_values(filter_values):
                if not isinstance(scalar, str) or not re.fullmatch(r"site-\d+", scalar):
                    raise PrivacyError(f"site filter survived at {location}")
        if filter_column in GEOGRAPHY_KEYS:
            for scalar in _scalar_values(filter_values):
                if not isinstance(scalar, str) or not re.fullmatch(r"geo-\d+", scalar):
                    raise PrivacyError(f"geography filter survived at {location}")
        if filter_column in IDENTITY_KEYS:
            for scalar in _scalar_values(filter_values):
                if scalar != MASK:
                    raise PrivacyError(f"identity filter survived at {location}")
        for child_key, child in value.items():
            verify_public_tree(
                child,
                registry_id,
                terms,
                key=child_key,
                path=(*path, child_key),
            )
    elif isinstance(value, list):
        for index, child in enumerate(value):
            verify_public_tree(
                child,
                registry_id,
                terms,
                key=key,
                path=(*path, str(index)),
            )
    elif isinstance(value, str):
        if value == MASK or re.fullmatch(r"(?:site|bu|geo|category)-\d+", value):
            return
        if terms.prose_pattern and terms.prose_pattern.search(value):
            raise PrivacyError(f"denylisted prose survived at {location}")
        if tabular and (
            UNIT_NUMBER_RE.search(value)
            or (not ISO_DATETIME_RE.match(value) and (POSTAL_RE.search(value) or COORD_RE.search(value)))
        ):
            raise PrivacyError(f"sensitive pattern survived at {location}")
        if tabular and _data_result_path(path) and (
            (lowered in RESULT_PROSE_KEYS or len(value) >= 80)
            and (
                RESULT_PERCENT_RE.search(value)
                or RESULT_DECIMAL_RE.search(value)
                or RESULT_COUNT_RE.search(value)
                or RESULT_NUMBER_RE.search(value)
            )
        ):
            raise PrivacyError(f"result number survived at {location}")
