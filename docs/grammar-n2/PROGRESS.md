# Theo dõi triển khai Ngữ pháp N2

Cập nhật: 2026-09-13. Đã triển khai bài 1; các bài 2–26 chưa được biên soạn.

> **Agent note (2026-09-14):** Active cross-session queue/status live in root `docs/PLAN.md`, `docs/PROGRESS.md`, and `docs/HANDOFF.md`. This file remains the detailed Lesson 1 pilot evidence log. Do not treat target 141/4230 as completed.

## Phạm vi đã chốt

141 nhóm / 26 bài / 4.230 câu mục tiêu. Bài 1 gồm 5 nhóm × 30 câu =150 câu, thay cho pilot45 câu ban đầu. Trạng thái học liệu là `agent_reviewed`; chưa có giáo viên độc lập xác nhận.

| ID      | Công việc                       | Trạng thái          | Bằng chứng / bước tiếp                                                                                       |
| ------- | ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| G00–G02 | Phân tích, khảo sát, lập plan   | DONE                | PLAN.md, IMPLEMENTATION-RULES.md                                                                             |
| G03     | Manifest26 bài và kiểm kê nhóm  | IN_PROGRESS         | manifest.json có26 bài, tổng141; danh mục từng nhóm mới hoàn thiện5 nhóm bài1                                |
| G04     | Học liệu bài1 /150 câu          | DONE (agent review) | lesson-01.json:50 Việt→Nhật,50 Nhật→Việt,50 sắp xếp; source PDF21–22                                         |
| G05     | Schema, migration, API          | DONE                | shared/grammar và server/modules/grammar; kiểm thử sở hữu, không lộ đáp án, restart                          |
| G06     | UI khóa, bài, chi tiết          | DONE                | 5 nhóm, tìm trong bài, cấu trúc/nghĩa/phạm vi/lưu ý/ví dụ, ruby bật/tắt                                      |
| G07     | Hai dạng dịch                   | DONE                | Lưu máy chủ và nháp trình duyệt, khớp mẫu/cần tự đối chiếu; đã thử trên browser                              |
| G08     | Sắp xếp cả câu                  | DONE                | 4 token ID, ★, trả mảnh, chấm toàn thứ tự; đã thử browser                                                    |
| G09     | Progress, FSRS, heatmap, export | DONE cho bài1       | Thêm SRS chống trùng, event duy nhất, API test kiểm tra XP, export không lộ câu chưa làm                     |
| G10     | Nghiệm thu bài1                 | DONE                | 11 tests pass; build pass; browser dịch/đổi tab/reload/ghép câu/đọc/SRS pass; responsive390px và format pass |
| G11     | Bài2–5                          | TODO                | Chưa biên soạn                                                                                               |
| G12     | Bài6–10                         | TODO                | Chưa biên soạn                                                                                               |
| G13     | Bài11–15                        | TODO                | Chưa biên soạn                                                                                               |
| G14     | Bài16–20                        | TODO                | Chưa biên soạn                                                                                               |
| G15     | Bài21–26                        | TODO                | Chưa biên soạn                                                                                               |
| G16     | Nghiệm thu toàn khóa            | TODO                | Không được báo hoàn tất4.230 câu khi mới có150                                                               |

## Coverage

- Bài có thể học:1/26; nhóm có nội dung:5/141; câu luyện:150/4.230.
- Câu Việt→Nhật:50; Nhật→Việt:50; sắp xếp:50. Mỗi nhóm có10 câu mỗi dạng, bộ đếm từ dữ liệu.
- Ví dụ minh họa:5, có ruby theo từ đã kiểm tra. Bài tập không có audio/AI chấm hoặc furigana toàn ngân hàng trong đợt này.
- Không dùng lại 32 câu starter hiện có để tăng số lượng module.
- Nội dung revision3; giữ các snapshot QA revision cũ trong DB, không xóa bài làm cũ.

## Quyết định triển khai so với plan

- Nội dung khóa/bài/pattern ở JSON server có Zod; các revision mẫu được lưu SQLite bất biến. Chưa tách toàn bộ metadata thành nhiều bảng lessons/patterns như thiết kế mở rộng vì hiện chỉ phát hành một bài. Khi mở rộng vẫn giữ ID và revision.
- Không backfill hoặc viết lại reviews/attempts cũ: stats hợp nhất grammar_events với dữ liệu cũ khi đọc; grammar_srs_links dùng chung entity key để chống cộng trùng. Các lượt học cũ giữ nguyên.
- Một session cho mỗi user/mẫu/revision. Làm lại giữ response history trên server và trong export; UI chưa có trình duyệt lịch sử từng lần thử. Khi đổi revision, phiên mới dùng nội dung mới, các bản cũ vẫn lưu trong export.
- Xem đáp án hoặc kiểm tra làm lộ đáp án: lượt làm lại của câu đó không cộng thêm XP. FSRS vẫn là nơi ôn tiếp và ghi lịch mới; không suy diễn điểm dịch thành FSRS rating.
- Furigana trên ví dụ ở chi tiết, không suy đoán cách đọc tự động cho câu tập.
- `tmp/` đã loại khỏi Git/Docker context để không đóng gói ảnh PDF nguồn hoặc script scratch.

## Nhật ký kiểm tra

2026-09-13: đọc trực quan PDF21–23 (trang in8–10), biên soạn5 nhóm và150 câu mới. Rà soát câu dịch và các mảnh sắp xếp; sửa lời giải để không gán cấu trúc Nの cho câu dùng động từ. Thêm ruby cho5 ví dụ. Chưa có kiểm duyệt ngôn ngữ độc lập của giáo viên.

`npm test`:11/11 pass, gồm content coverage/DTO, API ownership/conflict/resume/reveal/completion/XP/SRS, migration và integrity sau restart. `npm run build`:pass. `npm run format:check`:pass trước lượt cập nhật tài liệu cuối.

Browser thực tế: khóa→bài1→mẫu際; bật cách đọc; dịch Việt→Nhật khớp mẫu; Nhật→Việt khác mẫu→tự đối chiếu; reload giữ câu trả lời; ghép4 mảnh→đúng; đánh dấu đã đọc và thêmFSRS thành công. Đã sửa xung đột blur-autosave làm mất lần nhấn Kiểm tra. Mobile390px không tràn ngang.

Backup: `npm run backup -- data/grammar-lesson1-backup.sqlite` thành công và integrity_check OK. Không triển khai public; Docker chưa chạy trong phiên này.

## Bước tiếp theo

Bài1 đã nghiệm thu. Tiếp theo đối chiếu danh mục từng mẫu bài2–5, biên tập theo cùng hợp đồng dữ liệu và rà soát ngôn ngữ. Giữ mục tiêu141/4.230 và số nội dung thực tế riêng biệt.

Nghiệm thu cuối: module tests3/3 pass sau bổ sung backup→restore DB tạm, dữ liệu và5 snapshot còn nguyên; browser console0 lỗi/cảnh báo, mobile390px scrollWidth380px. Bằng chứng: lesson1-detail.png, lesson1-mobile.png. G10 hoàn tất trong phạm vi bài1; bước tiếp theo G03 còn lại và G11 bài2–5.
