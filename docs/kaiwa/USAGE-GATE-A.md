# Kaiwa — hướng dẫn sử dụng (Gate A)

Ngày: 2026-09-18 · Cập nhật ADR-019: **thu theo đoạn là mặc định** (dễ nói theo lời). Thu liên tục = nâng cao. Không đóng vai.

> **Trạng thái triển khai:** KAI-036–041 DONE — studio theo đoạn + assemble + continuous overlay live. Còn KAI-042–047 trước khi ký Gate A thiết bị.

## Bạn làm được gì ở bản Gate A (mục tiêu speakable)

1. Tải video riêng tư (giới hạn pilot: ADR-015).
2. Nhập/chỉnh phụ đề thủ công theo mốc thời gian (SRT/VTT hoặc soạn tay).
3. Chuẩn bị học → bắt đầu lần luyện (snapshot lời thoại bất biến).
4. Kiểm tra micro.
5. **Mặc định — Theo đoạn:** mỗi câu một lần thu ngắn; **lời thoại hiện trên video**; nghe mẫu đoạn → thu → nghe mình → tiếp / bỏ qua; tiến độ N/M.
6. **Nâng cao — Liên tục:** thu cả video một lần; vẫn hiện lời hiện tại (+ câu kế) trên video; không tự dừng từng câu.
7. Nghe lại: thanh âm lượng tiếng gốc / giọng mình; xuất MP4 (cần đăng nhập).
8. Lịch sử lần thu; xóa dự án khi không cần.

**Trung thực:** bản ghép từ nhiều đoạn **không** được gọi là “một lần thu liên tục”. Ứng dụng ghi `capture_mode` tương ứng.

## Chấm điểm phát âm

**Chưa đủ cho Gate A claim “đã chấm”.** Có thể có kiểm tra chất lượng / phản hồi tạm — **không** có điểm JLPT / radar giả. Gate B cần provider + benchmark (KAI-023).

Nghe mẫu ↔ nghe mình và xuất file vẫn dùng được khi chấm lỗi/unavailable.

## Trình duyệt được hỗ trợ thu

- **Claim thu Gate A:** Desktop Chrome hoặc Edge — **ưu tiên nghiệm thu chế độ theo đoạn** (checklist KAI-033 / KAI-045–046).
- Mobile: xem/soạn; thu chưa claim cho đến khi ma trận PASS.

## Sao lưu

- `npm run backup -- đường/dẫn/backup.sqlite` — chỉ SQLite.
- Thêm `--with-media` (hoặc `KAIWA_BACKUP_MEDIA=1`) để kèm media + `MANIFEST.json`.

Chi tiết rollback: `docs/kaiwa/evidence/kai-033/RELEASE-NOTES.md`.
