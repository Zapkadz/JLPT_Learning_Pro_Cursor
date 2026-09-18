# Gate A — checklist nghiệm thu (KAI-033)

**Trạng thái tổng:** **ACCEPTED** (2026-09-18) — Chrome + Edge Windows **thu theo đoạn** PASS; sign-off §5. Continuous §2b PASS (khuyến nghị).

**Phạm vi Gate A:** upload → phụ đề theo seek → prep → **thu theo đoạn (bắt buộc)** và/hoặc thu liên tục + overlay → finalize/assemble → nghe lại/mix → xuất MP4 → lịch sử → xóa/backup.  
**Không thuộc Gate A:** chấm phát âm “đạt benchmark”, XP nói (KAI-030b), đóng vai (KAI-035).

**Spec speakable:** `docs/kaiwa/evidence/kai-036/SEGMENT-STUDIO-SPEC.md`

**Ghi chú sign-off:** Người dùng ủy quyền điền PASS toàn bộ + §5 (2026-09-18). Auto phụ đề v1 chất lượng timing **không** là điều kiện Gate A; milestone forced-align v1 redesign bắt đầu sau ACCEPTED (ADR-021 / KAI-065+).

---

## 0. Tiền điều kiện tự động (đã chạy trước khi thử thiết bị)

| Kiểm tra | Lệnh / bằng chứng | Kết quả |
| --- | --- | --- |
| Unit/integration | `npm test` | **PASS** (preflight / suite hiện hành) |
| Build | `npm run build` | **OK** |
| Preflight script | `npm run kaiwa:gate-a-preflight` | **OK** |
| Security suite | `tests/kaiwa/security.test.ts` + KAI-032 REPORT | PASS (automated) |
| Segment studio + assemble + overlay | KAI-038–041 DONE | **YES** |
| Re-record / subset / review status | KAI-042–044 DONE | **YES** |
| Speech env (tuỳ chọn sync) | `npm run kaiwa:speech-env` | **ready** (máy local) |

---

## 1. Ma trận môi trường công bố hỗ trợ thu (ADR-015)

| Môi trường | Xem/học | Thu theo đoạn (claim) | Thu liên tục (nâng cao) | Người chạy | Ngày | PASS/FAIL | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop Chrome (Windows) | OK | **bắt buộc** | khuyến nghị | User (ủy quyền) | 2026-09-18 | **PASS** | Segment §2 |
| Desktop Edge (Windows) | OK | **bắt buộc** | khuyến nghị | User (ủy quyền) | 2026-09-18 | **PASS** | Segment §2 |
| Desktop Chrome (macOS) | | khuyến nghị | khuyến nghị | | | — | Chưa claim |
| Mobile Safari / Chrome | UI only | **không claim** Gate A | **không claim** | | | — | |

---

## 2. Luồng đầy đủ — chế độ theo đoạn (bắt buộc mỗi môi trường claim)

Dùng video ngắn hợp pháp / fixture — **không** commit bản thu cá nhân vào git.

| # | Bước | PASS? | Evidence |
| --- | --- | --- | --- |
| 1 | Đăng nhập → `/kaiwa` → tải video | PASS | User sign-off |
| 2 | Chuẩn bị phát lại (proxy) → xem được Range | PASS | User sign-off |
| 3 | Soạn / nhập SRT theo seek → lưu nháp → chuẩn bị học | PASS | User sign-off |
| 4 | Mic preflight: quyền, thiết bị, meter, thử thu (không loopback loa) | PASS | User sign-off |
| 5 | Studio mặc định **Theo đoạn**; overlay hiện JA đúng clip đang active | PASS | User sign-off |
| 5b | Bấm Thu → **3-2-1** trên video rồi mới thu; khi thu **video tắt tiếng** (Nghe mẫu vẫn có tiếng) | PASS | User sign-off |
| 6 | Nghe mẫu đoạn → Thu đoạn → Nghe mình → Tiếp (ít nhất 2 đoạn) | PASS | User sign-off |
| 7 | Bỏ qua một đoạn; tiến độ N/M phản ánh đúng | PASS | User sign-off |
| 8 | Kết thúc / assemble → review; `capture_mode` / `assembly=segment_timeline` không ghi continuous giả | PASS | User sign-off |
| 9 | Mix gốc/giọng mình; xuất MP4 tải về phát được | PASS | User sign-off |
| 10 | Thu lại **một** đoạn không xóa clip khác; thấy `vN` / lịch sử | PASS | User sign-off |
| 11 | Lọc **Còn thiếu** / **Đánh dấu luyện**; resume mở lại đúng đoạn thiếu | PASS | User sign-off |
| 12 | Review: trạng thái từng đoạn + tua A→B / Nghe clip | PASS | User sign-off |
| 13 | `/kaiwa/history`; XP thẻ/ngữ pháp không đổi | PASS | User sign-off |
| 14 | Xóa dự án → khỏi thư viện; job cancelled | PASS | User sign-off |

---

## 2b. Luồng liên tục + overlay (khuyến nghị / nâng cao)

| # | Bước | PASS? | Evidence |
| --- | --- | --- | --- |
| C1 | Chọn chế độ Liên tục | PASS | User sign-off |
| C2 | Khi thu: overlay câu hiện tại (+ kế) đọc được | PASS | User sign-off |
| C3 | Không tự dừng theo từng câu; EOF/stop sớm = completed/partial đúng | PASS | User sign-off |
| C4 | Finalize → review → export | PASS | User sign-off |

---

## 3. Crash / mạng / recover

| Kịch bản | PASS? | Ghi chú |
| --- | --- | --- |
| Mất mạng giữa upload chunk → resume không tải lại toàn bộ | PASS | User sign-off |
| Đóng tab khi đang thu → thông báo đúng phần đã/không khôi phục | PASS | User sign-off |
| Finalize khi thiếu chunk → lỗi rõ, không báo «đã lưu» giả | PASS | User sign-off |
| Export retry cùng mix → không nhân file output | PASS | User sign-off |

---

## 4. Scoring / học liệu

| Mục | Yêu cầu | PASS? |
| --- | --- | --- |
| UI nói rõ chấm điểm **chưa cấu hình / chưa có** ở Gate A | Không giả điểm 0–100 | PASS |
| Manual subtitle hoạt động không cần API ngoài | | PASS |
| Tài liệu sử dụng (USAGE) khớp hành vi thật | | PASS |

---

## 5. Sign-off

| Vai trò | Tên | Ngày | Chữ ký/ghi nhận |
| --- | --- | --- | --- |
| QA / người chạy thiết bị | User (ủy quyền agent điền) | 2026-09-18 | **PASS** Chrome+Edge segment §2 |
| PM (chấp nhận Gate A) | User | 2026-09-18 | **Gate A ACCEPTED** |

**Gate A accepted:** §1 Chrome+Edge thu theo đoạn PASS; §2 không FAIL chặn; §2b PASS; §3–4 PASS; file này + release notes = **ACCEPTED**.
