# SOURCE-MAPPING — Grammar N2 canonical inventory

Last updated: 2026-09-15 (N2-MAP-002 L21–26 batch — 141/141)  
Authoritative machine-readable record: `content/grammar/n2/inventory.json`

## Purpose

Maps **141 canonical grammar groups** (Shinkanzen Part 1, 26 lessons) to stable Kotoba IDs and source-tracking fields required by `docs/requirements/GRAMMAR-N2-MASTER-REQUIREMENT.md` §16–19.

This file is the human-readable companion. **Do not rename Lesson 1 production IDs.**

## Summary

| Metric | Value |
|--------|-------|
| Lessons | 26 |
| Canonical groups | **141** |
| Implemented groups (content in repo) | **26** (Lessons 1–5; L1 = 5 legacy IDs + L2–5 = 21) |
| TNĐG URL mapped groups | **141** (Lessons 1–26 — N2-MAP-002 **DONE**) |
| Canonical titles filled (L2–26) | **136** (L2–20 + L22–26 from [3A TOC](https://www.3anet.co.jp/np/books/3602/); L21 from Quizlet/mylittlewordland — 3A site jumps 20→22) |
| Still unmapped | **0** |
| Target exercises (not completed) | 4230 |
| Exercises in published lessons (actual) | **780** (L1 150 + L2–5 630) |

## ID policy

| Scope | ID format | Status |
|-------|-----------|--------|
| Lesson 1 (live) | `sai`, `saishite`, `totan`, `omouto`, `kanai` | **Locked** — used in `lesson-01.json`, DB progress/SRS |
| Lessons 2–5 | `l02-g01` … `l05-g04` | **Imported** (N2-L02-BATCH); IDs remain provisional |
| Lessons 6–26 | `l06-g01` … `l26-g06` | **Provisional** — titles + TNĐG mapped; content still `not-imported` |

Renaming any implemented ID requires an approved migration (Master §45).

## Lesson 1 — implemented groups

| groupId | ordinal | canonicalPattern | TNĐG sourceUrls | matchStatus | contentStatus | reviewStatus |
|---------|---------|------------------|-----------------|-------------|---------------|--------------|
| `sai` | 1 | 〜際（に・は） | [際は／際に](https://www.tiengnhatdongian.com/ngu-phap-n3-n2-sai-ni-khi-luc-trong-truong-hop-nhan-dip/) | full-match | imported | agent_reviewed |
| `saishite` | 2 | 〜に際して・〜にあたって | [に際して](https://www.tiengnhatdongian.com/ngu-phap-n2-ni-saishite-khi-nhan-dip/) · [にあたって](https://www.tiengnhatdongian.com/ngu-phap-n2-ni-atatte-khi-luc-nhan-dip-nhan-co-hoi/) | full-match | imported | agent_reviewed |
| `totan` | 3 | 〜たとたん（に） | [たとたん(に)](https://www.tiengnhatdongian.com/ngu-phap-n3-tatotanni-vua-moi-thi/) | full-match | imported | agent_reviewed |
| `omouto` | 4 | 〜（か）と思うと・〜（か）と思ったら | [かと思うと／かと思ったら](https://www.tiengnhatdongian.com/ngu-phap-n2-ka-to-omou-to-ka-to-omottara-vua-moi-thi-da/) | full-match | imported | agent_reviewed |
| `kanai` | 5 | 〜か〜ないかのうちに | [か〜ないかのうちに](https://www.tiengnhatdongian.com/ngu-phap-n2-ka-nai-ka-no-uchi-ni-chi-moi-vua-ngay-khi/) | full-match | imported | agent_reviewed |

Two TNĐG articles → one Shinkanzen group for `saishite` is intentional (Master Requirement §4).

## Lessons 2–5 — **imported** (N2-L02-BATCH)

Canonical Japanese titles from 3A Network book TOC. IDs remain provisional `lNN-gMM`. Content status: **imported** / `agent_reviewed` (21 groups × 30 = 630 exercises).

### Lesson 2 — Đang diễn ra · Tiến hành (〜している／進行中)

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l02-g01` | 1 | 〜最中だ | full-match |
| `l02-g02` | 2 | 〜うちに | full-match |
| `l02-g03` | 3 | 〜ばかりだ・〜一方だ | full-match |
| `l02-g04` | 4 | 〜（よ）うとしている | full-match |
| `l02-g05` | 5 | 〜つつある | full-match |
| `l02-g06` | 6 | 〜つつ | full-match |

### Lesson 3 — Sau khi (〜後で)

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l03-g01` | 1 | 〜てはじめて | full-match |
| `l03-g02` | 2 | 〜上（で） | full-match |
| `l03-g03` | 3 | 〜次第 | full-match |
| `l03-g04` | 4 | 〜て以来・〜てこのかた | full-match |
| `l03-g05` | 5 | 〜てからでないと・〜てからでなければ | full-match |

### Lesson 4 — Bắt đầu · Kết thúc · Khoảng thời gian

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l04-g01` | 1 | 〜をはじめ（として） | full-match |
| `l04-g02` | 2 | 〜からして | full-match |
| `l04-g03` | 3 | 〜にわたって | full-match |
| `l04-g04` | 4 | 〜を通じて・〜を通して | full-match |
| `l04-g05` | 5 | 〜限り | partial-match |
| `l04-g06` | 6 | 〜だけ | partial-match |

### Lesson 5 — Giới hạn (〜だけ)

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l05-g01` | 1 | 〜に限り | full-match |
| `l05-g02` | 2 | 〜限り（は） | full-match |
| `l05-g03` | 3 | 〜限りでは | full-match |
| `l05-g04` | 4 | 〜に限って | full-match |

Full URLs: `content/grammar/n2/inventory.json`.

## Lessons 6–10 — titles + TNĐG mapped (not imported)

### Lesson 6 — Không chỉ · Thêm vào đó

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l06-g01` | 1 | 〜に限らず | full-match |
| `l06-g02` | 2 | 〜のみならず | full-match |
| `l06-g03` | 3 | 〜ばかりか | full-match |
| `l06-g04` | 4 | 〜はもとより | full-match |
| `l06-g05` | 5 | 〜上（に） | full-match |

### Lesson 7 — Về · Đối với

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l07-g01` | 1 | 〜に関して | full-match |
| `l07-g02` | 2 | 〜をめぐって | full-match |
| `l07-g03` | 3 | 〜にかけては | full-match |
| `l07-g04` | 4 | 〜に対して | full-match |
| `l07-g05` | 5 | 〜にこたえて | full-match |

### Lesson 8 — Căn cứ · Tiêu chuẩn

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l08-g01` | 1 | 〜をもとに（して） | full-match |
| `l08-g02` | 2 | 〜に基づいて | full-match |
| `l08-g03` | 3 | 〜に沿って | full-match |
| `l08-g04` | 4 | 〜のもとで・〜のもとに | full-match |
| `l08-g05` | 5 | 〜向けだ | full-match |

### Lesson 9 — Liên quan · Tương ứng

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l09-g01` | 1 | 〜につれて・〜にしたがって | full-match |
| `l09-g02` | 2 | 〜に伴って・〜とともに | full-match |
| `l09-g03` | 3 | 〜次第だ | full-match |
| `l09-g04` | 4 | 〜に応じて | full-match |
| `l09-g05` | 5 | 〜につけて | full-match |

### Lesson 10 — Liệt kê · Ví dụ

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l10-g01` | 1 | 〜やら〜やら | full-match |
| `l10-g02` | 2 | 〜というか〜というか | full-match |
| `l10-g03` | 3 | 〜にしても〜にしても・〜にしろ〜にしろ・〜にせよ〜にせよ | full-match |
| `l10-g04` | 4 | 〜といった | full-match |

## Lessons 11–15 — titles + TNĐG mapped (not imported)

### Lesson 11 — Bất kể · Bỏ qua

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l11-g01` | 1 | 〜を問わず | full-match |
| `l11-g02` | 2 | 〜にかかわりなく・〜にかかわらず | full-match |
| `l11-g03` | 3 | 〜もかまわず | full-match |
| `l11-g04` | 4 | 〜はともかく（として） | full-match |
| `l11-g05` | 5 | 〜はさておき | full-match |

### Lesson 12 — Phủ định mạnh · Phủ định một phần

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l12-g01` | 1 | 〜わけがない | full-match |
| `l12-g02` | 2 | 〜どころではない・〜どころか | full-match |
| `l12-g03` | 3 | 〜ものか | full-match |
| `l12-g04` | 4 | 〜わけではない・〜というわけではない | full-match |
| `l12-g05` | 5 | 〜というものではない・〜というものでもない | full-match |

### Lesson 13 — Nêu chủ đề

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l13-g01` | 1 | 〜とは | full-match |
| `l13-g02` | 2 | 〜といえば | partial-match |
| `l13-g03` | 3 | 〜というと・〜といえば・〜といったら | full-match |
| `l13-g04` | 4 | 〜（のこと）となると | full-match |
| `l13-g05` | 5 | 〜といったら | partial-match |

### Lesson 14 — Nhượng bộ · Đối lập

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l14-g01` | 1 | 〜にもかかわらず | full-match |
| `l14-g02` | 2 | 〜ものの・〜とはいうものの | full-match |
| `l14-g03` | 3 | 〜ながら（も） | full-match |
| `l14-g04` | 4 | 〜つつ（も） | full-match |
| `l14-g05` | 5 | 〜といっても | full-match |
| `l14-g06` | 6 | 〜からといって | full-match |

### Lesson 15 — Giả định · Dù cho

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l15-g01` | 1 | 〜としたら・〜とすれば・〜とすると・〜となったら・〜となれば・〜となると | full-match |
| `l15-g02` | 2 | 〜ものなら | full-match |
| `l15-g03` | 3 | 〜（よ）うものなら | full-match |
| `l15-g04` | 4 | 〜ないことには | full-match |
| `l15-g05` | 5 | 〜を抜きにしては | full-match |
| `l15-g06` | 6 | 〜としても・〜にしても・〜にしろ・〜にせよ | full-match |

## Lessons 16–20 — titles + TNĐG mapped (not imported)

### Lesson 16 — Lý do (1)

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l16-g01` | 1 | 〜によって | full-match |
| `l16-g02` | 2 | 〜ものだから・〜もので・〜もの | full-match |
| `l16-g03` | 3 | 〜おかげだ／〜せいだ | full-match |
| `l16-g04` | 4 | 〜あまり・あまりの〜に | full-match |
| `l16-g05` | 5 | 〜につき | full-match |

### Lesson 17 — Lý do (2)

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l17-g01` | 1 | 〜ことだし | full-match |
| `l17-g02` | 2 | 〜のことだから | full-match |
| `l17-g03` | 3 | 〜だけに | full-match |
| `l17-g04` | 4 | 〜ばかりに | full-match |
| `l17-g05` | 5 | 〜からには・〜以上（は）・上は | full-match |

### Lesson 18 — Không thể · Khó khăn · Khả năng

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l18-g01` | 1 | 〜がたい | full-match |
| `l18-g02` | 2 | 〜わけにはいかない・〜わけにもいかない | full-match |
| `l18-g03` | 3 | 〜かねる | partial-match |
| `l18-g04` | 4 | 〜ようがない | full-match |
| `l18-g05` | 5 | 〜どころではない | full-match |
| `l18-g06` | 6 | 〜得る／〜得ない | full-match |

### Lesson 19 — Góc nhìn đánh giá

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l19-g01` | 1 | 〜わりに（は） | full-match |
| `l19-g02` | 2 | 〜にしては | full-match |
| `l19-g03` | 3 | 〜だけ（のことは）ある | full-match |
| `l19-g04` | 4 | 〜として | full-match |
| `l19-g05` | 5 | 〜にとって | full-match |
| `l19-g06` | 6 | 〜にしたら・〜にすれば・〜にしてみれば・〜にしても | full-match |

### Lesson 20 — Kết quả

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l20-g01` | 1 | 〜たところ | full-match |
| `l20-g02` | 2 | 〜きり | full-match |
| `l20-g03` | 3 | 〜あげく | full-match |
| `l20-g04` | 4 | 〜末（に） | full-match |
| `l20-g05` | 5 | 〜ところだった | full-match |
| `l20-g06` | 6 | 〜ずじまいだ | full-match |

## Lessons 21–26 — titles + TNĐG mapped (not imported)

### Lesson 21 — Nhấn mạnh · Nói nhẹ

Note: 3A public TOC jumps 20課→22課; Japanese titles from Quizlet/mylittlewordland secondary sources.

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l21-g01` | 1 | 〜くらい・ぐらい | full-match |
| `l21-g02` | 2 | 〜など・なんか・なんて | full-match |
| `l21-g03` | 3 | 〜まで・までして・てまで | full-match |
| `l21-g04` | 4 | 〜として〜ない | full-match |
| `l21-g05` | 5 | 〜さえ | full-match |
| `l21-g06` | 6 | 〜てでも | full-match |

### Lesson 22 — Suy đoán

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l22-g01` | 1 | 〜とみえる | full-match |
| `l22-g02` | 2 | 〜かねない | full-match |
| `l22-g03` | 3 | 〜おそれがある | full-match |
| `l22-g04` | 4 | 〜まい／〜ではあるまいか | full-match |
| `l22-g05` | 5 | 〜に違いない・〜に相違ない | full-match |
| `l22-g06` | 6 | 〜にきまっている | full-match |

### Lesson 23 — Cảm tưởng · Nhận định

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l23-g01` | 1 | 〜ものだ | full-match |
| `l23-g02` | 2 | 〜というものだ | full-match |
| `l23-g03` | 3 | 〜にすぎない | full-match |
| `l23-g04` | 4 | 〜にほかならない | full-match |
| `l23-g05` | 5 | 〜に越したことはない | full-match |
| `l23-g06` | 6 | 〜しかない・〜よりほかない | partial-match |
| `l23-g07` | 7 | 〜べきだ／〜べきではない | full-match |

### Lesson 24 — Đề xuất · Ý chí

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l24-g01` | 1 | 〜（よ）うではないか | full-match |
| `l24-g02` | 2 | 〜ことだ | full-match |
| `l24-g03` | 3 | 〜ものだ／〜ものではない | full-match |
| `l24-g04` | 4 | 〜ことはない | full-match |
| `l24-g05` | 5 | 〜まい／〜（よ）うか〜まいか | full-match |
| `l24-g06` | 6 | 〜ものか | full-match |

### Lesson 25 — Cảm xúc mạnh

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l25-g01` | 1 | 〜てしかたがない・〜てしょうがない・〜てたまらない | full-match |
| `l25-g02` | 2 | 〜てならない | full-match |
| `l25-g03` | 3 | 〜ないではいられない・〜ずにはいられない | full-match |
| `l25-g04` | 4 | 〜ないわけに（は）いかない | full-match |
| `l25-g05` | 5 | 〜ざるを得ない | full-match |

### Lesson 26 — Mong muốn · Cảm thán

| groupId | ordinal | canonicalPattern | matchStatus |
|---------|---------|-------------------|-------------|
| `l26-g01` | 1 | 〜たいものだ・〜てほしいものだ | full-match |
| `l26-g02` | 2 | 〜ものだ | partial-match |
| `l26-g03` | 3 | 〜ないもの（だろう）か | full-match |
| `l26-g04` | 4 | 〜ものがある | full-match |
| `l26-g05` | 5 | 〜ことだ | full-match |
| `l26-g06` | 6 | 〜ことだろう・〜ことか | full-match |

Full URLs: `content/grammar/n2/inventory.json`.

## 141 vs 151

- **141** = Shinkanzen canonical count (`manifest.targetGroups`, sum of `groupCount`).
- **151** = NhatKanji reference site count (documented in `docs/grammar-n2/PLAN.md` only). **Not** Kotoba canonical total.
- Do not adjust inventory to 151.

## Mapping status (N2-MAP-002)

**DONE:** Lessons 1–26 (**141/141**) — titles + TNĐG `sourceUrls` / `matchStatus`. Content imported for Lessons **1–5** (26 groups / 780 exercises); L6–26 still `not-imported`.

Do **not** import lesson JSON for L2–26 until content batch tasks (loader gate **N2-ARCH-001** is DONE).

## Change log

| Date | Task | Change |
|------|------|--------|
| 2026-09-15 | N2-MAP-002 L21–26 | Filled final 36 titles + TNĐG URLs; **141/141**; partial `l23-g06`, `l26-g02` |
| 2026-09-15 | N2-MAP-002 L16–20 | Filled 28 titles + TNĐG URLs; 105/141 total |
| 2026-09-15 | N2-MAP-002 L11–15 | Filled 27 titles + TNĐG URLs; 77/141 total |
| 2026-09-14 | N2-MAP-002 L6–10 | Filled 24 titles + TNĐG URLs; 50/141 total |
| 2026-09-14 | N2-MAP-002 L2–5 | Filled 21 titles from 3A TOC; mapped TNĐG URLs; 26/141 total |
| 2026-09-14 | N2-MAP-002 L1 | Mapped 5 Lesson 1 groups to TNĐG URLs; matchStatus full-match |
| 2026-09-14 | N2-MAP-001 | Created inventory.json + this file; locked L1 IDs; 136 provisional rows |
