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
# Country and broad region are safe to publish; street-level geography remains masked.
PUBLIC_GEOGRAPHY_KEYS = {
    "country",
    "country_name",
    "country_code",
    "location_country",
    "cdp_region",
    "region_name",
}
GEOGRAPHY_KEYS: set[str] = set()
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
    "cluster_count",
}
DATA_RESULT_AGENTS = {"d1", "d2", "d3", "cp1", "p1", "p2", "p3", "s1", "c1", "c2", "f1"}
PERCENT_KEYS = {"pct_diff", "tolerance", "near_breach_ratio"}
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
RESULT_TOKEN_RE = re.compile(
    r"(?<![\w-])[+-]?\d[\d,.]*(?:\s*(?:%|GWh|MWh|kWh|tCO₂e|tCO2e|(?:underlying\s+|source\s+)?(?:sites?|rows?|records?|entries|divisions?|locations?|flags?|findings?)))?(?![\w-])",
    re.IGNORECASE,
)
PARTIAL_OUTPUT_RE = re.compile(r"(?:<10|[+-]?\d[\d,.]*\*+[\d.*]*)(?:\s*%)?")
PUBLIC_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
PUBLIC_CONTEXT_NUMBER_RE = re.compile(
    r"(?:(?:Business Unit|Site(?: ref)?|Scope|ETS|Art\.?)\s+|§)\d+",
    re.IGNORECASE,
)
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
    site_index: int = 0

    def register_site_pairs(self, value: Any) -> None:
        if isinstance(value, dict):
            location_id = value.get("location_id")
            location_name = value.get("location_name")
            if location_id is not None and location_name is not None:
                ref_table = self.tables.setdefault("site_ref", {})
                name_table = self.tables.setdefault("site", {})
                raw_ref = str(location_id).strip().casefold()
                raw_name = str(location_name).strip().casefold()
                if raw_ref not in ref_table and raw_name not in name_table:
                    self.site_index += 1
                    ref_table[raw_ref] = f"Site ref {self.site_index:03d}"
                    name_table[raw_name] = f"Site {self.site_index:03d}"
            for child in value.values():
                self.register_site_pairs(child)
        elif isinstance(value, list):
            for child in value:
                self.register_site_pairs(child)

    def site_label(self, value: Any) -> str:
        raw = str(value).strip().casefold()
        if raw in self.tables.get("site", {}):
            return self.tables["site"][raw]
        if raw in self.tables.get("site_ref", {}):
            return self.tables["site_ref"][raw].replace("Site ref", "Site")
        return self.token("site", raw)

    def token(self, kind: str, value: Any) -> str:
        table = self.tables.setdefault(kind, {})
        raw = str(value).strip().casefold()
        if raw not in table:
            if kind in {"site", "site_ref"}:
                self.site_index += 1
                index = self.site_index
            else:
                index = len(table) + 1
            if kind == "site":
                table[raw] = f"Site {index:03d}"
            elif kind == "site_ref":
                table[raw] = f"Site ref {index:03d}"
            elif kind == "bu":
                table[raw] = f"Business Unit {index}"
            else:
                table[raw] = f"{kind}-{index:02d}"
        return table[raw]


@dataclass
class SensitiveTerms:
    sites: set[str] = field(default_factory=set)
    identity: set[str] = field(default_factory=set)
    geography: set[str] = field(default_factory=set)
    business: set[str] = field(default_factory=set)
    people: set[str] = field(default_factory=set)
    measurements: set[str] = field(default_factory=set)
    _compiled_prose_pattern: re.Pattern[str] | None = field(
        default=None, init=False, repr=False
    )
    _compiled_business_pattern: re.Pattern[str] | None = field(default=None, init=False, repr=False)
    _compiled_site_pattern: re.Pattern[str] | None = field(default=None, init=False, repr=False)
    _compiled_hidden_pattern: re.Pattern[str] | None = field(default=None, init=False, repr=False)

    @property
    def prose_terms(self) -> list[str]:
        terms = self.sites | self.identity | self.geography | self.business | self.people
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

    @staticmethod
    def _pattern(values: set[str]) -> re.Pattern[str] | None:
        if not values:
            return None
        alternatives = "|".join(re.escape(term) for term in sorted(values, key=len, reverse=True))
        return re.compile(rf"(?<!\w)(?:{alternatives})(?!\w)", re.IGNORECASE)

    @property
    def business_pattern(self) -> re.Pattern[str] | None:
        if self._compiled_business_pattern is None:
            self._compiled_business_pattern = self._pattern(self.business)
        return self._compiled_business_pattern

    @property
    def site_pattern(self) -> re.Pattern[str] | None:
        if self._compiled_site_pattern is None:
            self._compiled_site_pattern = self._pattern(self.sites)
        return self._compiled_site_pattern

    @property
    def hidden_pattern(self) -> re.Pattern[str] | None:
        if self._compiled_hidden_pattern is None:
            hidden = (self.identity - self.sites) | self.geography | self.people
            self._compiled_hidden_pattern = self._pattern(hidden)
        return self._compiled_hidden_pattern


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
                if lowered in SITE_KEYS:
                    terms.sites.add(text)
    elif lowered in GEOGRAPHY_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if len(text) >= 2:
                terms.geography.add(text)
    elif lowered in BUSINESS_KEYS:
        for scalar in _scalar_values(value):
            text = str(scalar).strip()
            if len(text) >= 3 and any(character.isalpha() for character in text):
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


def _replace_terms(text: str, terms: SensitiveTerms, tokenizer: Tokenizer) -> str:
    cleaned = text
    if terms.business_pattern:
        cleaned = terms.business_pattern.sub(
            lambda match: tokenizer.token("bu", match.group(0)), cleaned
        )
    if terms.site_pattern:
        cleaned = terms.site_pattern.sub(
            lambda match: tokenizer.site_label(match.group(0)), cleaned
        )
    if terms.hidden_pattern:
        cleaned = terms.hidden_pattern.sub(MASK, cleaned)
    return cleaned


def _partial_mask_text(text: str) -> str:
    digit_count = sum(character.isdigit() for character in text)
    if digit_count == 1:
        return "".join("*" if character.isdigit() else character for character in text)
    reveal = min(3, max(1, digit_count - 1))
    seen = 0
    result: list[str] = []
    for character in text:
        if character.isdigit():
            seen += 1
            result.append(character if seen <= reveal else "*")
        else:
            result.append(character)
    return "".join(result)


def _partial_mask_number(value: int | float) -> str:
    if abs(value) < 10 and float(value).is_integer():
        return f"{int(value)}.*"
    return _partial_mask_text(format(value, ".12g"))


def _partial_mask_count(value: int | float) -> str:
    if 0 <= value < 10:
        return "<10"
    return _partial_mask_text(format(value, ".12g"))


def _partial_mask_percent(value: int | float) -> str:
    percent = format(value * 100, ".8f").rstrip("0").rstrip(".")
    if "." not in percent:
        percent += ".0"
    return f"{_partial_mask_text(percent)}%"


def _mask_result_token(match: re.Match[str]) -> str:
    token = match.group(0)
    context = match.string[max(0, match.start() - 24):match.start()]
    if re.search(
        r"(?:(?:Business Unit|Site(?: ref)?|Scope|ETS|Art\.?)\s+|§)$",
        context,
        re.IGNORECASE,
    ):
        return token
    parts = re.fullmatch(r"([+-]?\d[\d,.]*)(.*)", token, re.IGNORECASE)
    if not parts:
        return token
    number, suffix = parts.groups()
    bare = number.replace(",", "")
    if not suffix and re.fullmatch(r"(?:19|20)\d{2}", bare):
        return token
    count_match = re.fullmatch(
        r"([+-]?\d[\d,.]*)\s+((?:underlying\s+|source\s+)?(?:sites?|rows?|records?|entries|divisions?|locations?|flags?|findings?))",
        token,
        re.IGNORECASE,
    )
    if count_match and abs(float(count_match.group(1).replace(",", ""))) < 10:
        return f"<10 {count_match.group(2)}"
    return f"{_partial_mask_text(number)}{suffix}"


def scrub_prose(
    text: str,
    terms: SensitiveTerms,
    tokenizer: Tokenizer,
    *,
    tabular: bool,
    mask_result_numbers: bool = False,
) -> str:
    cleaned = _replace_terms(text, terms, tokenizer)
    if tabular:
        cleaned = COMPANY_RE.sub("the company", cleaned)
        if not mask_result_numbers:
            cleaned = UNIT_NUMBER_RE.sub(_mask_result_token, cleaned)
        if not ISO_DATETIME_RE.match(cleaned):
            cleaned = POSTAL_RE.sub(MASK, cleaned)
            if not mask_result_numbers:
                cleaned = COORD_RE.sub(MASK, cleaned)
        if mask_result_numbers:
            cleaned = RESULT_TOKEN_RE.sub(_mask_result_token, cleaned)
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

    if tabular and key is None and not path:
        tokenizer.register_site_pairs(value)

    if lowered in PERSON_KEYS:
        return _map_nested_values(value, lambda _: MASK)

    if tabular and lowered in SITE_KEYS:
        kind = "site_ref" if lowered == "location_id" else "site"
        return _map_nested_values(value, lambda item: tokenizer.token(kind, item))
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
            numeric = float(value) if isinstance(value, str) else value
            if lowered in PERCENT_KEYS:
                return _partial_mask_percent(numeric)
            if _data_count_key(key, path):
                return _partial_mask_count(numeric)
            return _partial_mask_number(numeric)
    if tabular and lowered == "tolerance" and _data_result_path(path):
        numeric = float(value) if isinstance(value, str) else value
        return _partial_mask_percent(numeric)
    if tabular and "catalog_snapshot" in path and isinstance(value, (int, float)) and not isinstance(value, bool):
        return _partial_mask_number(value)

    if isinstance(value, dict):
        filter_column = str(value.get("column", "")).lower() if tabular else ""
        transformed: dict[str, Any] = {}
        for child_key, child in value.items():
            if child_key in {"value", "values"} and filter_column in BUSINESS_KEYS:
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("bu", item)
                )
            elif child_key in {"value", "values"} and filter_column in SITE_KEYS:
                kind = "site_ref" if filter_column == "location_id" else "site"
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token(kind, item)
                )
            elif child_key in {"value", "values"} and filter_column in GEOGRAPHY_KEYS:
                transformed[child_key] = _map_nested_values(
                    child, lambda item: tokenizer.token("geo", item)
                )
            elif child_key in {"value", "values"} and filter_column in IDENTITY_KEYS:
                transformed[child_key] = _map_nested_values(child, lambda _: MASK)
            elif child_key in {"value", "values"} and filter_column in PUBLIC_GEOGRAPHY_KEYS:
                transformed[child_key] = child
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
        if lowered in PUBLIC_GEOGRAPHY_KEYS:
            return value
        if "selectable_filters" in path or "available_date_range" in path:
            return tokenizer.token("category", raw)
        return scrub_prose(
            value,
            terms,
            tokenizer,
            tabular=True,
            mask_result_numbers=(
                _data_result_path(path)
                and (lowered in RESULT_PROSE_KEYS or len(value) >= 80)
            ),
        )
    if isinstance(value, str) and (
        lowered in PROSE_KEYS or len(value) >= 80
    ):
        return scrub_prose(value, terms, tokenizer, tabular=tabular)
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
            expected = r"Site ref \d+" if lowered == "location_id" else r"Site \d+"
            if not isinstance(scalar, str) or not re.fullmatch(expected, scalar):
                raise PrivacyError(f"site identity survived at {location}.{lowered}")
    if tabular and lowered in BUSINESS_KEYS:
        for scalar in _scalar_values(value):
            if not isinstance(scalar, str) or not re.fullmatch(r"Business Unit \d+", scalar):
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
    if tabular and lowered == "tolerance" and _data_result_path(path) and (
        isinstance(value, (int, float))
        or (isinstance(value, str) and NUMBER_RE.fullmatch(value.strip()))
    ):
        raise PrivacyError(f"result tolerance survived at {location}.{lowered}")
    if tabular and "catalog_snapshot" in path and isinstance(value, (int, float)) and not isinstance(value, bool):
        raise PrivacyError(f"catalog number survived at {location}.{lowered}")

    if isinstance(value, dict):
        filter_column = str(value.get("column", "")).lower() if tabular else ""
        filter_values = value.get("values", value.get("value"))
        if filter_column in BUSINESS_KEYS:
            for scalar in _scalar_values(filter_values):
                if not isinstance(scalar, str) or not re.fullmatch(r"Business Unit \d+", scalar):
                    raise PrivacyError(f"business filter survived at {location}")
        if filter_column in SITE_KEYS:
            for scalar in _scalar_values(filter_values):
                expected = r"Site ref \d+" if filter_column == "location_id" else r"Site \d+"
                if not isinstance(scalar, str) or not re.fullmatch(expected, scalar):
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
        if value == MASK or re.fullmatch(
            r"(?:Site|Site ref) \d+|Business Unit \d+|(?:geo|category)-\d+", value
        ):
            return
        if terms.prose_pattern and terms.prose_pattern.search(value):
            raise PrivacyError(f"denylisted prose survived at {location}")
        if tabular and (
            UNIT_NUMBER_RE.search(value)
            or (not ISO_DATETIME_RE.match(value) and (POSTAL_RE.search(value) or COORD_RE.search(value)))
        ):
            raise PrivacyError(f"sensitive pattern survived at {location}")
        numeric_check = PUBLIC_CONTEXT_NUMBER_RE.sub("", value)
        numeric_check = PUBLIC_YEAR_RE.sub("", PARTIAL_OUTPUT_RE.sub("", numeric_check))
        if tabular and _data_result_path(path) and (
            (lowered in RESULT_PROSE_KEYS or len(value) >= 80)
            and (
                RESULT_PERCENT_RE.search(numeric_check)
                or RESULT_DECIMAL_RE.search(numeric_check)
                or RESULT_COUNT_RE.search(numeric_check)
            )
        ):
            raise PrivacyError(f"result number survived at {location}")
