"""
Voting service — Trial mode peer review.

Each participant votes on every other participant's answer using
structured output (JSON with dimension ratings and a comment).
Votes are anonymized: the voter sees labels (Model A, B, C) not
real model names.
"""

from __future__ import annotations

import json
import time

import openai as openai_sdk

from app.services.providers import _require_key, stream_provider


async def run_vote(
    provider: str,
    model_id: str,
    system_prompt: str,
    composed_prompt: str,
    keys: dict[str, str],
    label_to_seat: dict[str, str],
    dimensions: list[str],
    temperature: float | None = None,
) -> dict:
    """
    Run one voter's structured vote.

    Returns:
      - vote: list of {targetSeatId, ratings: {dim: 1-5}, comment}
      - error: str | None
      - ts: int (millis)
    """
    json_schema_hint = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "label": {"type": "string", "description": "Model label (A, B, C, ...)"},
                "ratings": {
                    "type": "object",
                    "description": f"Ratings for dimensions: {', '.join(dimensions)}",
                    "properties": {dim: {"type": "integer", "minimum": 1, "maximum": 5} for dim in dimensions},
                },
                "comment": {"type": "string", "description": "Brief explanation"},
            },
        },
    }

    ratings_format = ", ".join(f'"{d}": 1-5' for d in dimensions)
    prompt_with_instruction = (
        composed_prompt
        + "\n\nRespond with a JSON array of vote objects. Each object should have: "
        f'{{"label": "A", "ratings": {{{ratings_format}}}, "comment": "your reasoning"}}'
        f"\nRate each model on these dimensions (1=poor, 5=excellent): {', '.join(dimensions)}"
    )

    try:
        # Collect full response (non-streaming for structured output)
        accumulated = ""
        async for chunk in stream_provider(
            provider=provider,
            model_id=model_id,
            messages=[{"role": "user", "content": prompt_with_instruction}],
            system_prompt=system_prompt,
            keys=keys,
            temperature=temperature,
        ):
            accumulated += chunk

        # Parse votes from JSON response
        votes = _parse_votes(accumulated, label_to_seat, dimensions)

        return {
            "vote": votes,
            "ts": int(time.time() * 1000),
        }
    except Exception as e:
        return {
            "vote": [],
            "error": str(e),
            "ts": int(time.time() * 1000),
        }


def _parse_votes(
    text: str,
    label_to_seat: dict[str, str],
    dimensions: list[str],
) -> list[dict]:
    """Extract vote entries from the model's JSON response."""
    # Find JSON array in the response
    start = text.find("[")
    end = text.rfind("]") + 1

    if start < 0 or end <= start:
        return []

    try:
        parsed = json.loads(text[start:end])
    except json.JSONDecodeError:
        return []

    votes = []
    for entry in parsed:
        label = entry.get("label", "")
        seat_id = label_to_seat.get(label)
        if not seat_id:
            continue

        ratings = entry.get("ratings", {})
        # Clamp ratings to 1-5
        clean_ratings = {}
        for dim in dimensions:
            val = ratings.get(dim)
            if isinstance(val, (int, float)):
                clean_ratings[dim] = max(1, min(5, int(val)))
            else:
                clean_ratings[dim] = 3  # Default

        votes.append({
            "targetSeatId": seat_id,
            "ratings": clean_ratings,
            "comment": entry.get("comment", ""),
        })

    return votes
