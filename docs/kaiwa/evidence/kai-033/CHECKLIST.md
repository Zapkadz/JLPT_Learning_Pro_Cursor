# Gate A — checklist nghiệm thu (KAI-033)

**Trạng thái tổng:** PENDING — Gate A ACCEPTED cần **thu theo đoạn (segment)** PASS trên Chrome/Edge (ADR-019 / KAI-045–046). Continuous-only không đủ.

**Phạm vi Gate A:** upload → phụ đề theo seek → prep → **thu theo đoạn (bắt buộc)** và/hoặc thu liên tục + overlay → finalize/assemble → nghe lại/mix → xuất MP4 → lịch sử → xóa/backup.  
**Không thuộc Gate A:** chấm phát âm “đạt benchmark”, XP nói (KAI-030b), đóng vai (KAI-035).

**Spec speakable:** `docs/kaiwa/evidence/kai-036/SEGMENT-STUDIO-SPEC.md`

---

## 0. Tiền điều kiện tự động (đã chạy trước khi thử thiết bị)

| Kiểm tra | Lệnh / bằng chứng | Kết quả |
| --- | --- | --- |
| Unit/integration | `npm test` | **110 / 110** (2026-09-18, `kaiwa:gate-a-preflight`) |
| Build | `npm run build` | **OK** (same preflight run) |
| Preflight script | `npm run kaiwa:gate-a-preflight` | **OK** (checklist content + test + build) |
| Security suite | `tests/kaiwa/security.test.ts` + KAI-032 REPORT | PASS (automated) |
| Segment studio + assemble + overlay | KAI-038–041 DONE | **YES** |
| Re-record / subset / review status | KAI-042–044 DONE | **YES** |

---

## 1. Ma trận môi trường công bố hỗ trợ thu (ADR-015)

| Môi trường | Xem/học | Thu theo đoạn (claim) | Thu liên tục (nâng cao) | Người chạy | Ngày | PASS/FAIL | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop Chrome (Windows) | | **bắt buộc** | khuyến nghị | | | | |
| Desktop Edge (Windows) | | **bắt buộc** | khuyến nghị | | | | |
| Desktop Chrome (macOS) | | khuyến nghị | khuyến nghị | | | | |
| Mobile Safari / Chrome | UI only | **không claim** Gate A | **không claim** | | | | |

---

## 2. Luồng đầy đủ — chế độ theo đoạn (bắt buộc mỗi môi trường claim)

Dùng video ngắn hợp pháp / fixture — **không** commit bản thu cá nhân vào git.

| # | Bước | PASS? | Evidence |
| --- | --- | --- | --- |
| 1 | Đăng nhập → `/kaiwa` → tải video | | |
| 2 | Chuẩn bị phát lại (proxy) → xem được Range | | |
| 3 | Soạn / nhập SRT theo seek → lưu nháp → chuẩn bị học | | |
| 4 | Mic preflight: quyền, thiết bị, meter, thử thu (không loopback loa) | | |
| 5 | Studio mặc định **Theo đoạn**; overlay hiện JA đúng clip đang active | | |
| 5b | Bấm Thu → **3-2-1** trên video rồi mới thu; khi thu **video tắt tiếng** (Nghe mẫu vẫn có tiếng) | | |
| 6 | Nghe mẫu đoạn → Thu đoạn → Nghe mình → Tiếp (ít nhất 2 đoạn) | | |
| 7 | Bỏ qua một đoạn; tiến độ N/M phản ánh đúng | | |
| 8 | Kết thúc / assemble → review; `capture_mode` / `assembly=segment_timeline` không ghi continuous giả | | |
| 9 | Mix gốc/giọng mình; xuất MP4 tải về phát được | | |
| 10 | Thu lại **một** đoạn không xóa clip khác; thấy `vN` / lịch sử | | |
| 11 | Lọc **Còn thiếu** / **Đánh dấu luyện**; resume mở lại đúng đoạn thiếu | | |
| 12 | Review: trạng thái từng đoạn + tua A→B / Nghe clip | | |
| 13 | `/kaiwa/history`; XP thẻ/ngữ pháp không đổi | | |
| 14 | Xóa dự án → khỏi thư viện; job cancelled | | |

---

## 2b. Luồng liên tục + overlay (khuyến nghị / nâng cao)

| # | Bước | PASS? | Evidence |
| --- | --- | --- | --- |
| C1 | Chọn chế độ Liên tục | | |
| C2 | Khi thu: overlay câu hiện tại (+ kế) đọc được | | |
| C3 | Không tự dừng theo từng câu; EOF/stop sớm = completed/partial đúng | | |
| C4 | Finalize → review → export | | |

---

## 3. Crash / mạng / recover

| Kịch bản | PASS? | Ghi chú |
| --- | --- | --- |
| Mất mạng giữa upload chunk → resume không tải lại toàn bộ | | |
| Đóng tab khi đang thu → thông báo đúng phần đã/không khôi phục | | |
| Finalize khi thiếu chunk → lỗi rõ, không báo «đã lưu» giả | | |
| Export retry cùng mix → không nhân file output | | |

---

## 4. Scoring / học liệu

| Mục | Yêu cầu | PASS? |
| --- | --- | --- |
| UI nói rõ chấm điểm **chưa cấu hình / chưa có** ở Gate A | Không giả điểm 0–100 | |
| Manual subtitle hoạt động không cần API ngoài | | |
| Tài liệu sử dụng (USAGE) khớp hành vi thật | | |

---

## 5. Sign-off

| Vai trò | Tên | Ngày | Chữ ký/ghi nhận |
| --- | --- | --- | --- |
| QA / người chạy thiết bị | | | |
| PM (chấp nhận Gate A) | | | |

**Gate A accepted chỉ khi:** mục §1 Chrome+Edge **thu theo đoạn** PASS, §2 (segment flow) không còn FAIL chặn, §2b khuyến nghị, §3–4 không FAIL chặn, và file này + release notes = ACCEPTED. Continuous-only không đủ (ADR-019).
