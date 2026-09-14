# Canonical UX ownership

| Capability     | Canonical owner                 | Source of truth       | Allowed variants                           | Verification     |
| -------------- | ------------------------------- | --------------------- | ------------------------------------------ | ---------------- |
| Select/Listbox | Field + native select           | DESIGN.md             | OS popup accepted                          | keyboard/browser |
| Form           | shared Field, Zod server schema | shared/domain.ts      | create/edit/auth                           | E2E validation   |
| Scrollbar      | src/styles.css                  | DESIGN.md tokens      | heatmap horizontal                         | mobile overflow  |
| Toast          | shared Status                   | API/error state       | success/error/info                         | live region      |
| CRUD           | deck routes                     | server/index.ts       | create returns detail; edit returns detail | E2E              |
| Dialog         | native dialog wrapper           | src/components/ui.tsx | destructive/discard                        | focus/Escape     |

All actions are buttons, navigation links. Titles localized on route change. Save pending disables duplicates. Validation preserves fields and announces error. Unsaved editor changes use useBlocker with app-owned discard dialog, plus beforeunload for browser departure. No credentials in localStorage. Session expiry returns sign-in; editor draft in sessionStorage contains only study content and is removed after save. Search is local, query persisted in URL, clear button restores focus. Lists use explicit Load more, bounded detail content and 500-note import limit. Review server enforces reveal before rating and optimistic card version. Mobile retains every action. Deletion names the deck and uses a dialog; cancel gets initial focus. Date/time reports use Asia/Ho_Chi_Minh; persisted timestamps UTC.

## Grammar ownership

Grammar tabs and token ordering belong to src/features/grammar/Grammar.tsx; shared schemas/public DTO belong to shared/grammar/types.ts; grading and content publication belong to server/modules/grammar. Existing Field, Status, button styles and authentication are reused. Drafts persist on input in sessionStorage and autosave after650ms. Conflict409 retains local text with explicit refresh-state/retry controls. No blur handler may disable Check before its click. Japanese IME does not submit on Enter. Token IDs remain stable; server validates ownership, permutation and full sentence. Read status is explicit; completion requires all30 responses and self-review of unmatched translations. Server history preserves previous responses; UI does not advertise history browsing yet.
