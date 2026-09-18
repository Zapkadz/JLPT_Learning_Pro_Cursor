# Gate A — device runbook (KAI-046)

Dành cho người chạy Chrome/Edge. **Không** commit bản thu cá nhân / video riêng tư vào git.

## Trước khi mở browser

1. `git checkout feat/kaiwa-memory && git pull`
2. `npm run kaiwa:gate-a-preflight` — §0 checklist phải đã PASS (đã điền 2026-09-18).
3. `npm run dev` (hoặc quy trình chạy app local của bạn).
4. Đăng nhập tài khoản thử; dùng video ngắn **hợp pháp** / fixture.

## Chrome (Windows) — bắt buộc

Làm lần lượt `CHECKLIST.md` **§2** (14 bước theo đoạn). Ghi PASS/FAIL + ghi chú ngắn vào bảng §1 hàng Chrome.

Đặc biệt kiểm:

- Overlay lời trên video khi thu đoạn
- Bỏ qua / lọc còn thiếu / đánh dấu luyện
- Kết thúc phiên → review không ghi `continuous` giả
- Thu lại một đoạn → clip khác còn
- Xuất MP4 tải về mở được

## Edge (Windows) — bắt buộc

Lặp §2 trên Edge. Ghi §1 hàng Edge.

## Continuous (khuyến nghị) — §2b

Chỉ sau khi §2 segment PASS. Overlay câu hiện tại + kế; không dừng theo câu.

## Sau khi xong

1. Điền §5 sign-off trên `CHECKLIST.md`.
2. Ảnh chụp / ghi chú giữ **ngoài** repo.
3. Báo agent/PM: Gate A ACCEPTED chỉ khi Chrome+Edge segment PASS.

## Không làm

- Không đánh PASS chỉ vì continuous OK.
- Không giả điểm phát âm.
- Không force-push / không commit media riêng tư.
