# Kaiwa — hướng dẫn sử dụng (Gate A)

Ngày: 2026-09-18 · ADR-019: **thu theo đoạn là mặc định**. Thu liên tục = nâng cao. Không đóng vai.

> **Trạng thái triển khai:** Studio theo đoạn + countdown/mute OK. Gate A thiết bị = KAI-046. **Kế hoạch auto phụ đề (ADR-020):** v1 = video + lời không timeline → tự gắn giờ; v2 = chỉ video → ASR. Spec: `docs/kaiwa/evidence/kai-050/AUTO-SUBTITLE-SPEC.md` — **chưa code**.

## Bạn làm được gì ở bản Gate A (mục tiêu speakable)

1. Tải video riêng tư (giới hạn pilot: ADR-015).
2. Nhập/chỉnh phụ đề thủ công theo mốc thời gian (SRT/VTT hoặc soạn tay).
3. Chuẩn bị học → bắt đầu lần luyện (snapshot lời thoại bất biến).
4. Kiểm tra micro.
5. **Mặc định — Theo đoạn:** mỗi câu một lần thu ngắn; **lời thoại hiện trên video**; nghe mẫu → **đếm 3-2-1** → thu (video tắt tiếng mẫu) → nghe mình → tiếp / bỏ qua; lọc còn thiếu / đánh dấu luyện; thu lại một đoạn không xóa clip khác.
6. **Kết thúc phiên** → ghép timeline (`assembly=segment_timeline`); khoảng trống = im lặng trên track giọng mình.
7. **Nâng cao — Liên tục:** đếm 3-2-1 → thu cả video; overlay câu hiện tại + câu kế; video tắt tiếng khi thu; không tự dừng từng câu.
8. Nghe lại: mix gốc/giọng mình; **trạng thái từng đoạn** + tua cửa sổ / nghe clip; xuất MP4 (cần đăng nhập).
9. Lịch sử lần thu; xóa dự án khi không cần.

**Trung thực:** bản ghép từ nhiều đoạn **không** được gọi là “một lần thu liên tục”. Ứng dụng ghi `capture_mode` / `assembly` tương ứng.

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
