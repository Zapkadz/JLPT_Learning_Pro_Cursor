# Gate A — checklist nghiệm thu (KAI-033)

**Trạng thái tổng:** PENDING device evidence — không đánh dấu Gate A accepted cho đến khi các mục Chrome/Edge Desktop được điền PASS kèm ngày/người chạy.

**Phạm vi Gate A:** upload → phụ đề thủ công → prep → thu liên tục → finalize → nghe lại/mix → xuất MP4 → lịch sử → xóa/backup.  
**Không thuộc Gate A:** chấm phát âm tự động (KAI-015/023–029), XP nói (KAI-030b), đóng vai (KAI-035).

---

## 0. Tiền điều kiện tự động (đã chạy trước khi thử thiết bị)

| Kiểm tra | Lệnh / bằng chứng | Kết quả |
| --- | --- | --- |
| Unit/integration | `npm test` | điền: ___ / ___ |
| Build | `npm run build` | điền: OK / FAIL |
| Preflight script | `npm run kaiwa:gate-a-preflight` | điền: OK / FAIL |
| Security suite | `tests/kaiwa/security.test.ts` + KAI-032 REPORT | PASS (automated) |

---

## 1. Ma trận môi trường công bố hỗ trợ thu (ADR-015)

| Môi trường | Xem/học | Thu (claim) | Người chạy | Ngày | PASS/FAIL | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| Desktop Chrome (Windows) | | **bắt buộc** | | | | |
| Desktop Edge (Windows) | | **bắt buộc** | | | | |
| Desktop Chrome (macOS) | | khuyến nghị | | | | |
| Mobile Safari / Chrome | UI only | **không claim** Gate A | | | | |

---

## 2. Luồng đầy đủ (mỗi môi trường claim thu)

Dùng video ngắn hợp pháp / fixture tự tạo — **không** commit bản thu cá nhân vào git.

| # | Bước | PASS? | Evidence (ảnh/ghi chú path ngoài repo) |
| --- | --- | --- | --- |
| 1 | Đăng nhập → `/kaiwa` → tải video | | |
| 2 | Chuẩn bị phát lại (proxy) → xem được Range | | |
| 3 | Soạn / nhập SRT thủ công → lưu nháp → chuẩn bị học | | |
| 4 | Mic preflight: quyền, chọn thiết bị, meter, thử thu (không loopback loa) | | |
| 5 | Countdown → thu liên tục tới EOF (hoặc dừng sớm = partial) | | |
| 6 | Finalize → chuyển review; audio mic phát được | | |
| 7 | Mix gốc/giọng mình lưu được; refresh giữ prefs | | |
| 8 | Xuất MP4 → tải về phát được | | |
| 9 | Thu lại tạo attempt mới (không đè) | | |
| 10 | `/kaiwa/history` thấy lần thu; XP thẻ/ngữ pháp không đổi | | |
| 11 | Xóa dự án → không còn trong thư viện; job liên quan cancelled | | |

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

**Gate A accepted chỉ khi:** mục §1 Chrome+Edge Desktop PASS, §2–4 không còn FAIL chặn, và file này + release notes được cập nhật trạng thái ACCEPTED.
