# Gate A — device runbook (KAI-046)

Dành cho người chạy Chrome/Edge. **Không** commit bản thu cá nhân / video riêng tư vào git.

## Trước khi mở browser

1. `git checkout feat/kaiwa-memory && git pull`
2. `npm run kaiwa:gate-a-preflight` — §0 checklist phải PASS.
3. `npm run dev` (hoặc quy trình chạy app local của bạn).
4. Đăng nhập tài khoản thử; dùng video ngắn **hợp pháp** / fixture.
5. (Khuyến nghị) Cài ffmpeg + set `FFMPEG_PATH` nếu muốn thử đồng bộ script / ASR; **không** bắt buộc để PASS Gate A speakable (SRT/tay đủ).

## Chrome (Windows) — bắt buộc

Làm lần lượt `CHECKLIST.md` **§2** (14 bước theo đoạn). Ghi PASS/FAIL + ghi chú ngắn vào bảng §1 hàng Chrome.

Đặc biệt kiểm:

- Overlay lời trên video khi thu đoạn
- **3-2-1** trước khi thu; **video mute** lúc đang thu; Nghe mẫu vẫn có tiếng
- Bỏ qua / lọc còn thiếu / đánh dấu luyện
- Kết thúc phiên → review không ghi `continuous` giả
- Thu lại một đoạn → clip khác còn
- Xuất MP4 tải về mở được

### Smoke phụ đề (tuỳ chọn — không chặn Gate A)

Trên màn soạn phụ đề, sau khi video ready:

1. Dán 2–3 dòng JA → **Áp dụng lời đã dán** (placeholder times) → lưu nháp OK.
2. Nếu `scriptAlign` ready: **Đồng bộ lời thoại với video** → thấy banner bản nháp máy → sửa 1 mốc → không tự publish.
3. Nếu `transcription` ready: **Tự tạo phụ đề từ video (ASR)** → banner cảnh báo chữ máy → không tự publish.
4. Nếu capability `not_configured`: thấy thông báo trung thực; SRT/VTT vẫn nhập được.

## Edge (Windows) — bắt buộc

Lặp §2 trên Edge. Ghi §1 hàng Edge. Smoke phụ đề (tuỳ chọn) giống Chrome nếu muốn.

## Continuous (khuyến nghị) — §2b

Chỉ sau khi §2 segment PASS. Overlay câu hiện tại + kế; không dừng theo câu; countdown/mute khi thu.

## Sau khi xong

1. Điền §5 sign-off trên `CHECKLIST.md`.
2. Ảnh chụp / ghi chú giữ **ngoài** repo.
3. Báo agent/PM: Gate A ACCEPTED chỉ khi Chrome+Edge segment PASS.
4. Cập nhật `docs/kaiwa/evidence/kai-046/REPORT.md` bảng browser (PASS/FAIL).

## Không làm

- Không đánh PASS chỉ vì continuous OK.
- Không giả điểm phát âm.
- Không force-push / không commit media riêng tư.
- Không đánh Gate A PASS chỉ vì auto phụ đề chạy được.
