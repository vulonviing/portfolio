from __future__ import annotations

import unittest

from anonymize import (
    MASK,
    SensitiveTerms,
    Tokenizer,
    anonymize,
    collect_sensitive_terms,
    verify_public_tree,
)


REGISTRY_ID = "uc2_ets1_scope_memo"


class AnonymizeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source = {
            "location_id": "4711",
            "location_name": "Secret Plant",
            "bu_rc": "DIV-A",
            "country": "Germany",
            "cdp_region": "Europe",
            "city": "Berlin",
            "approved_by": "Reviewer Name",
            "method_a": 123.45,
            "method_b": 120.0,
            "abs_delta": 3.45,
            "pct_diff": 0.02875,
        }
        self.terms = SensitiveTerms()
        collect_sensitive_terms(self.source, self.terms)

    def mask(self, value: object) -> object:
        return anonymize(value, REGISTRY_ID, self.terms, tokenizer=Tokenizer())

    def test_masks_structured_identity_geography_and_measurements(self) -> None:
        masked = self.mask(self.source)
        self.assertEqual(masked["location_id"], "Site ref 001")
        self.assertEqual(masked["location_name"], "Site 001")
        self.assertEqual(masked["bu_rc"], "Business Unit 1")
        self.assertEqual(masked["country"], "Germany")
        self.assertEqual(masked["cdp_region"], "Europe")
        self.assertEqual(masked["city"], MASK)
        self.assertEqual(masked["approved_by"], MASK)
        self.assertEqual(masked["method_a"], "123.**")
        self.assertEqual(masked["method_b"], "12*")
        self.assertEqual(masked["abs_delta"], "3.4*")
        self.assertEqual(masked["pct_diff"], "2.87*%")

    def test_masks_short_business_lists_and_result_prose_numbers(self) -> None:
        value = {
            "agents": {
                "c2": {
                    "payload": {
                        "thin_data_divisions": ["DIV-A"],
                        "readiness_assessment": "3 sites differ by 2.875% and 123 tonnes.",
                    }
                }
            }
        }
        masked = self.mask(value)
        payload = masked["agents"]["c2"]["payload"]
        self.assertEqual(payload["thin_data_divisions"], ["Business Unit 1"])
        self.assertEqual(
            payload["readiness_assessment"],
            "<10 sites differ by 2.87*% and 12* tonnes.",
        )

    def test_masks_catalog_values_and_statistics_but_keeps_schema_names(self) -> None:
        value = {
            "catalog_snapshot": {
                "source_tables": {
                    "dist_ie_energy_raw": {
                        "row_count": 100,
                        "columns": [
                            {
                                "name": "amount_consumed_mwh",
                                "null_count": 2,
                                "unique_count": 98,
                            }
                        ],
                    }
                },
                "selectable_filters": {
                    "entity_filters": {"country": ["Germany"]}
                },
            }
        }
        masked = self.mask(value)
        table = masked["catalog_snapshot"]["source_tables"]["dist_ie_energy_raw"]
        self.assertEqual(table["row_count"], "10*")
        self.assertEqual(table["columns"][0]["null_count"], "<10")
        self.assertEqual(table["columns"][0]["name"], "amount_consumed_mwh")
        self.assertEqual(
            masked["catalog_snapshot"]["selectable_filters"]["entity_filters"]["country"],
            ["Germany"],
        )

    def test_masks_quality_counts_and_evidence_completeness(self) -> None:
        value = {
            "agents": {
                "d1": {
                    "payload": {
                        "summary": {
                            "tables_detail": {
                                "public_table_name": {
                                    "quality_summary": {"status": {"Approved": 17}}
                                }
                            }
                        }
                    }
                },
                "d2": {"payload": {"evidence_completeness": 0.875}},
            }
        }
        masked = self.mask(value)
        self.assertEqual(
            masked["agents"]["d1"]["payload"]["summary"]["tables_detail"]
            ["public_table_name"]["quality_summary"]["status"]["Approved"],
            "1*",
        )
        self.assertEqual(
            masked["agents"]["d2"]["payload"]["evidence_completeness"],
            "0.87*",
        )

    def test_masks_granular_period_tolerance_and_profile_count(self) -> None:
        value = {
            "agents": {
                "d3": {
                    "payload": {
                        "tolerance": 0.05,
                        "rows": [{"year": "2025", "years_used": [2023, 2024, 2025]}],
                    }
                },
                "cp1": {
                    "payload": {
                        "cluster_count": 6,
                        "limitations": ["The 2025 dataset contains 17 locations."],
                    }
                },
            }
        }
        masked = self.mask(value)
        self.assertEqual(masked["agents"]["d3"]["payload"]["tolerance"], "5.*%")
        self.assertEqual(masked["agents"]["d3"]["payload"]["rows"][0]["year"], "2025")
        self.assertEqual(
            masked["agents"]["d3"]["payload"]["rows"][0]["years_used"],
            [2023, 2024, 2025],
        )
        self.assertEqual(masked["agents"]["cp1"]["payload"]["cluster_count"], "<10")
        self.assertEqual(
            masked["agents"]["cp1"]["payload"]["limitations"][0],
            "The 2025 dataset contains 1* locations.",
        )
        verify_public_tree(masked, REGISTRY_ID, self.terms)

    def test_keeps_public_scope_numbers_outside_result_payloads(self) -> None:
        value = {"natural_request": "Apply the public 5% threshold in FY2024."}
        self.assertEqual(self.mask(value), value)

    def test_uc4_keeps_public_content_but_masks_people(self) -> None:
        value = {
            "summary": "Siemens public report text for ESRS E1.",
            "reviewer": "Jane Doe",
        }
        terms = SensitiveTerms()
        collect_sensitive_terms(value, terms)
        masked = anonymize(value, "uc4_esrs_2026_impact", terms)
        self.assertEqual(masked["summary"], value["summary"])
        self.assertEqual(masked["reviewer"], MASK)
        verify_public_tree(masked, "uc4_esrs_2026_impact", terms)


if __name__ == "__main__":
    unittest.main()
