import json
from functools import lru_cache
from pathlib import Path

from app.schemas.soc import MitreTechnique

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "mitre_techniques.json"


@lru_cache
def load_mitre_techniques() -> list[dict]:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def get_technique_by_id(technique_id: str) -> dict | None:
    normalized_id = technique_id.upper()
    return next(
        (technique for technique in load_mitre_techniques() if technique["technique_id"] == normalized_id),
        None,
    )


def map_log_to_techniques(log_content: str, event_type: str = "") -> list[MitreTechnique]:
    text = f"{event_type} {log_content}".lower()
    mappings: list[MitreTechnique] = []

    for technique in load_mitre_techniques():
        keywords = technique.get("example_keywords", [])
        matched_keywords = [keyword for keyword in keywords if keyword.lower() in text]
        if matched_keywords:
            mappings.append(_build_mapping(technique, matched_keywords))

    return mappings


def enrich_technique_mapping(technique_ids: list[str], log_content: str = "") -> list[MitreTechnique]:
    text = log_content.lower()
    enriched: list[MitreTechnique] = []

    for technique_id in sorted(set(technique_ids)):
        technique = get_technique_by_id(technique_id)
        if technique is None:
            continue
        keywords = technique.get("example_keywords", [])
        matched_keywords = [keyword for keyword in keywords if keyword.lower() in text]
        enriched.append(_build_mapping(technique, matched_keywords))

    return enriched


def _build_mapping(technique: dict, matched_keywords: list[str]) -> MitreTechnique:
    return MitreTechnique(
        technique_id=technique["technique_id"],
        name=technique["name"],
        tactic=technique["tactic"],
        description=technique["description"],
        common_log_sources=technique["common_log_sources"],
        detection_ideas=technique["detection_ideas"],
        mitigation=technique["mitigation"],
        example_keywords=technique["example_keywords"],
        matched_keywords=matched_keywords,
    )
