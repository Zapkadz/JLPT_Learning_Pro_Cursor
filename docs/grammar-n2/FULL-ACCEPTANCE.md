# Grammar N2 — Full-course acceptance evidence (N2-FULL-ACC)

Generated: 2026-09-16  
Branch: `feat/n2-full-acc` (after PR #12 merge to `main`)  
Requirement: Master Requirement **§73** (+ §71/§74 notes)

## Verdict

| Layer | Result |
|-------|--------|
| Scale 26 / 141 / 4230 | **PASS** (automated) |
| Per-group 10+10+10, examples ≥3, no practice↔example overlap | **PASS** (automated) |
| Unique exercise IDs + unique prompts | **PASS** (4230 / 4230) |
| No placeholder / script markers in prompts-examples | **PASS** (heuristic) |
| Unit/API grammar suite `npm test` | **15/15 PASS** |
| `npm run build` | **PASS** |
| Playwright `npm run test:e2e` | **2/2 PASS** |
| Independent teacher review (§23) | **PENDING — not claimed** |

**Do not treat this as teacher-approved / expert-verified.**  
Content remains `agent_reviewed` in inventory and lesson JSON.

## How to re-run

```bash
node scripts/n2-full-acceptance.mjs
npm test
npm run build
npm run test:e2e
```

Machine-readable counts: `docs/grammar-n2/FULL-ACCEPTANCE-EVIDENCE.json`.

## §73 checklist (content)

- [x] 26 lessons published  
- [x] 141 canonical groups present and unique  
- [x] Each group has content + ≥3 examples + 30 exercises  
- [x] 4230 exercises; each group 10 vi-ja + 10 ja-vi + 10 order  
- [x] answers / explanations / order tokens present  
- [x] no empty order tokens; hints ≠ full answers (validator)  
- [x] inventory `imported` / `agent_reviewed` for all 141  

## Explicitly still open

1. **Independent teacher review** of language quality / nuance across 141 groups.  
2. **N2-L01-FURI-001** — **DONE** (ADR-009 policy B; optional JA→VI `promptRuby`; agent readings).  
3. Manual responsive UI spot-check (desktop/tablet/mobile) beyond existing e2e.  

## Safety

Per §74: counts alone are not completion. This report pairs counts with automated validators + regression evidence, and refuses teacher-verified claims without a human reviewer.
