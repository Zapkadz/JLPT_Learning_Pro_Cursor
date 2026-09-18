#!/usr/bin/env python3
"""
KAI-076 — validate / summarize held-out results JSON (no media I/O).

Usage:
  set KAIWA_HELD_OUT_DIR=%USERPROFILE%\\kaiwa-held-out
  python scripts/kaiwa/held_out_summary.py
  python scripts/kaiwa/held_out_summary.py --results path\\to\\results.json

Does not read video/audio. Safe to run without private files present.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "docs" / "kaiwa" / "evidence" / "kai-076" / "RESULTS.template.json"
CATEGORIES = {"clean_dialogue", "light_bgm", "heavy_bgm", "overlap", "other"}


def load_results(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data.get("clips"), list):
        raise SystemExit("results.json must have clips: []")
    return data


def summarize(clips: list[dict]) -> dict:
    by: dict[str, list[float]] = {}
    for c in clips:
        cat = c.get("category") or "other"
        if cat not in CATEGORIES:
            print(f"warn: unknown category {cat!r} on {c.get('id')}", file=sys.stderr)
        epv = c.get("editPerVideoMin")
        if epv is None:
            vm = float(c.get("videoMinutes") or 0)
            em = float(c.get("editMinutes") or 0)
            epv = (em / vm) if vm > 0 else None
        if epv is None:
            continue
        by.setdefault(cat, []).append(float(epv))
    out = {}
    for cat, vals in sorted(by.items()):
        out[cat] = {
            "clipCount": len(vals),
            "medianEditPerVideoMin": round(statistics.median(vals), 3),
            "meanEditPerVideoMin": round(statistics.mean(vals), 3),
        }
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--results", type=Path, default=None)
    args = ap.parse_args()

    held = os.environ.get("KAIWA_HELD_OUT_DIR", "").strip()
    path = args.results
    if path is None:
        if held:
            path = Path(held) / "results.json"
        else:
            print("KAI-076 held-out summary")
            print("No --results and KAIWA_HELD_OUT_DIR unset.")
            print(f"Template: {TEMPLATE}")
            print("Copy template -> %KAIWA_HELD_OUT_DIR%\\results.json and re-run.")
            return 0

    if not path.is_file():
        print(f"Missing results file: {path}")
        print(f"Start from template: {TEMPLATE}")
        return 2

    data = load_results(path)
    clips = data.get("clips") or []
    # Ignore template placeholder example if still present alone
    real = [c for c in clips if c.get("id") != "example-clean-01"]
    if not real and clips:
        print("Only template example clip found — replace with real measurements.")
        return 2

    summary = summarize(real)
    print("KAI-076 held-out summary")
    print(f"file: {path}")
    print(f"clips: {len(real)}")
    for cat, stats in summary.items():
        print(
            f"  {cat}: n={stats['clipCount']}  "
            f"median edit/min={stats['medianEditPerVideoMin']}  "
            f"mean={stats['meanEditPerVideoMin']}"
        )
        if cat == "heavy_bgm":
            print("    (reported separately — not merged into clean_dialogue)")

    data["summaryComputed"] = summary
    out_path = path.with_name("results.summary.json")
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
