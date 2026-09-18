# Kaiwa — hướng dẫn sử dụng (Gate A)

Ngày: 2026-09-18 · ADR-019: **thu theo đoạn là mặc định**. Thu liên tục = nâng cao. Không đóng vai.

> **Trạng thái triển khai:** Studio theo đoạn + countdown/mute OK. Gate A thiết bị = KAI-046.  
> **Auto phụ đề v1 (ADR-020):** đã có **đồng bộ script** (video + lời không timeline → máy gán giờ vào **bản nháp**). v2 ASR chỉ-video **chưa** bật. Spec: `docs/kaiwa/evidence/kai-050/AUTO-SUBTITLE-SPEC.md`.

## Bạn làm được gì ở bản Gate A (mục tiêu speakable)

1. Tải video riêng tư (giới hạn pilot: ADR-015).
2. Nhập/chỉnh phụ đề theo mốc thời gian:
   - **Thủ công:** SRT/VTT hoặc soạn tay (luôn có).
   - **v1 Đồng bộ script:** dán / tải lời **không thời gian** → nút **「Đồng bộ lời thoại với video (tự gán thời gian)」** khi `scriptAlign` sẵn sàng (cần ffmpeg + Whisper cục bộ). Kết quả = **bản nháp máy** — phải kiểm tra mốc rồi mới publish / bắt đầu luyện. **Không** tự publish.
3. Chuẩn bị học → bắt đầu lần luyện (snapshot lời thoại bất biến).
4. Kiểm tra micro.
5. **Mặc định — Theo đoạn:** mỗi câu một lần thu ngắn; **lời thoại hiện trên video**; nghe mẫu → **đếm 3-2-1** → thu (video tắt tiếng mẫu) → nghe mình → tiếp / bỏ qua; lọc còn thiếu / đánh dấu luyện; thu lại một đoạn không xóa clip khác.
6. **Kết thúc phiên** → ghép timeline (`assembly=segment_timeline`); khoảng trống = im lặng trên track giọng mình.
7. **Nâng cao — Liên tục:** đếm 3-2-1 → thu cả video; overlay câu hiện tại + câu kế; video tắt tiếng khi thu; không tự dừng từng câu.
8. Nghe lại: mix gốc/giọng mình; **trạng thái từng đoạn** + tua cửa sổ / nghe clip; xuất MP4 (cần đăng nhập).
9. Lịch sử lần thu; xóa dự án khi không cần.

**Trung thực:** bản ghép từ nhiều đoạn **không** được gọi là “một lần thu liên tục”. Ứng dụng ghi `capture_mode` / `assembly` tương ứng.

## Đồng bộ script (v1) — honesty

| Tình huống | Ứng xử |
| --- | --- |
| `scriptAlign.status = ready` | CTA đồng bộ hiện; cần xác nhận sẽ kiểm tra mốc; xử lý audio **cục bộ** (faster-whisper) khi cấu hình đủ |
| `scriptAlign.status = not_configured` | Hiện thông báo trung thực; **SRT/VTT / soạn tay / dán script tạm** vẫn dùng được |
| Sau đồng bộ | Banner: *「Bản nháp máy tạo — hãy kiểm tra mốc thời gian trước khi luyện.」*; đoạn yếu có thể gắn *「Đoạn này khớp chưa chắc — nên sửa tay.」* |
| Publish / luyện | Chỉ sau khi bạn mở editor và chốt / start-practice — máy **không** tự publish |
| Chữ hiển thị | Giữ **script bạn đưa**; engine chỉ gán thời gian (không thay lời bằng ASR) |
| v2 ASR chỉ-video | **Chưa** — capability `transcription` vẫn `not_configured` |

Cấu hình pilot: `FFMPEG_PATH` (hoặc `KAIWA_FFMPEG_PATH`), Python + `faster-whisper`; tùy chọn `KAIWA_WHISPER_MODEL` (mặc định `tiny`), `KAIWA_PYTHON`. Kiểm thử: `KAIWA_SCRIPT_ALIGN_ENGINE=mock` (không dùng production claim).

## Chấm điểm phát âm

**Chưa đủ cho Gate A claim “đã chấm”.** Có thể có kiểm tra chất lượng / phản hồi tạm — **không** có điểm JLPT / radar giả. Gate B cần provider + benchmark (KAI-023).

Nghe mẫu ↔ nghe mình và xuất file vẫn dùng được khi chấm lỗi/unavailable.

## Trình duyệt được hỗ trợ thu

- **Claim thu Gate A:** Desktop Chrome hoặc Edge — **bắt buộc PASS chế độ theo đoạn** (checklist KAI-033 / KAI-045–046).
- Continuous + overlay: khuyến nghị trên cùng ma trận; **không** thay thế segment PASS.
- Mobile: xem/soạn; thu chưa claim cho đến khi ma trận PASS.

## Sao lưu

- `npm run backup -- đường/dẫn/backup.sqlite` — chỉ SQLite.
- Thêm `--with-media` (hoặc `KAIWA_BACKUP_MEDIA=1`) để kèm media + `MANIFEST.json`.

Chi tiết rollback: `docs/kaiwa/evidence/kai-033/RELEASE-NOTES.md`.
