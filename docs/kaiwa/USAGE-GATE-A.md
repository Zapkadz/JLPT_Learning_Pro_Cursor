# Kaiwa — hướng dẫn sử dụng (Gate A)

Ngày: 2026-09-18 · Phạm vi: lồng tiếng liên tục toàn video (không đóng vai).

## Bạn làm được gì ở bản này

1. Tải video riêng tư (giới hạn pilot: xem cấu hình server / ADR-015).
2. Nhập hoặc chỉnh phụ đề thủ công (SRT/VTT); furigana / romaji / bản dịch Việt tùy chọn.
3. Chuẩn bị học → bắt đầu lần thu (snapshot lời thoại bất biến).
4. Kiểm tra micro → thu liên tục theo video → chốt bản thu.
5. Nghe lại với hai thanh âm lượng: **tiếng gốc** và **giọng mình**.
6. Xuất file MP4 (mix đã snapshot) và tải về (cần đăng nhập).
7. Xem lịch sử lần thu; xóa dự án khi không còn cần.

## Chấm điểm phát âm

**Chưa có trong Gate A.** Ứng dụng không chấm điểm tiếng Nhật tự động ở bản này.  
Không có điểm số / radar / «JLPT speaking score». Phản hồi học tập tự động thuộc Gate B (cần provider + benchmark).

Bạn vẫn có thể luyện bằng cách nghe mẫu ↔ nghe mình và xuất file để tự nghe lại.

## Trình duyệt được hỗ trợ thu

- **Claim thu Gate A:** Desktop Chrome hoặc Edge (xem checklist KAI-033).
- Mobile: dùng để xem/soạn được; thu chưa được công bố hỗ trợ cho đến khi ma trận thiết bị PASS.

## Sao lưu

- `npm run backup -- đường/dẫn/backup.sqlite` — chỉ SQLite.
- Thêm `--with-media` (hoặc `KAIWA_BACKUP_MEDIA=1`) để kèm thư mục media + `MANIFEST.json`.

## Riêng tư

Video và bản thu nằm trên máy chủ của bạn, chỉ truy cập qua phiên đăng nhập. Không dùng URL đoán được công khai.
