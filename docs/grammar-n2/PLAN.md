> Cập nhật đã chốt:141 nhóm,4.230 câu toàn khóa. Bài1 triển khai đủ150 câu (10/dạng/mẫu), thay cho pilot45 câu dự kiến ban đầu. Các mốc còn lại giữ theo lộ trình; quyết định kỹ thuật đã thực hiện được ghi trong PROGRESS.md.
>
> **Agent note (2026-09-14):** Live task IDs for agents are in root `docs/PLAN.md` (N2-*). This file is historical design specification for the Grammar N2 module.

# Kế hoạch module học Ngữ pháp N2

Ngày: 2026-09-13. Trạng thái: đã triển khai bài 1; xem PROGRESS.md để biết phạm vi thực tế. Đây là đặc tả đề xuất để review trước khi code; các quyết định mặc định bên dưới chưa phải tính năng hiện có.

## 1. Yêu cầu và kết quả cần đạt

Tạo mục **Học ngữ pháp** độc lập với **Luyện thi JLPT → Ngữ pháp** hiện có. Luồng chính: khóa N2 → bài học → các mẫu trong bài → chi tiết mẫu → bài tập ba tab Việt → Nhật, Nhật → Việt, Sắp xếp câu. Nguồn học liệu chính là PDF người dùng cung cấp; website và 7 ảnh là tham khảo trải nghiệm, không phải chỉ dẫn thực thi hay nguồn để sao chép toàn bộ nội dung.

Hoàn tất nghĩa là có đủ học liệu đã duyệt theo danh mục PDF, đầy đủ ba dạng luyện cho mỗi mẫu được phát hành, lưu/tiếp tục bài làm, tiến độ thật, tích hợp ôn tập, hoạt động trên desktop/mobile, migration an toàn và kiểm thử. Một bài mẫu chạy được chỉ là mốc pilot, không được báo toàn bộ module hoàn thành.

## 2. Những gì đã xác minh

- PDF `C:/Users/giap1/Downloads/Ngữ pháp Shinkanzen N2.pdf`: 235 trang; kiểm tra trích xuất tất cả trang trả về không có text. Đây là tài liệu scan, cần OCR hoặc phiên chép từ ảnh rồi đối chiếu.
- Đã đọc trực quan mục lục PDF trang 5–9 và trang 21 (trang in 8, bắt đầu bài 1). Chưa đọc/biên tập toàn bộ 235 trang; không coi kết quả OCR tương lai là nội dung đã duyệt.
- Phần 1 có 26 bài, đếm mục đánh số trong mục lục được 141 **nhóm mẫu**. Nhóm có thể chứa nhiều biến thể; đây là số kiểm kê ban đầu, cần đối chiếu từng bài trước khi khóa manifest.
- Website hiển thị 26 bài/151 mẫu. Ví dụ bài 2 website ghi 7, PDF đánh số 6; bài 4 là 7 so với 6; bài 5 là 5 so với 4. Không ép dữ liệu PDF khớp 151 bằng cách tự thêm mẫu.
- PDF còn có phần hệ thống hóa, phần 2 về ghép câu, phần 3 về ngữ pháp văn bản, đề thi thử và phần đáp án được nhắc trong mục lục. Phạm vi phát hành này là 26 bài phần 1 và ba hình thức luyện riêng của app; không nhập toàn bộ phần còn lại một cách ngầm định. Chưa xác minh đầy đủ vị trí/phạm vi đáp án trong file.
- Các trang công khai của website đã xem: danh sách khóa, bài 1, mẫu 際 và trang bài tập. Ba tab, gợi ý, kiểm tra, xem đáp án được thể hiện trong ảnh/trang. Chưa thử dịch vụ chấm AI hoặc nội dung bị khóa. Bộ đếm trên trang có chỗ ghi 0/5 dù tab ghi 10: app phải tính từ dữ liệu, không sao chép lỗi này.
- Code hiện tại: React + TypeScript + Vite; Express + SQLite; cookie session, FSRS, `/practice`, `/api/stats`, `/api/export`. Bảng `attempts` và schema câu hỏi hiện tại dành cho trắc nghiệm, không thích hợp nhét trực tiếp câu dịch/chuỗi token vào.

Nguồn tham khảo:

- https://nhaikanji.com/bunpo/shinkanzen-bunpo-n2
- https://nhaikanji.com/bunpo/shinkanzen-bunpo-n2/part1-lesson1
- https://nhaikanji.com/bunpo/shinkanzen-bunpo-n2/part1-lesson1/n2-sai-ni
- https://nhaikanji.com/bunpo/shinkanzen-bunpo-n2/part1-lesson1/n2-sai-ni/exercise

## 3. Danh mục học liệu ban đầu

Tên tiếng Việt dưới đây là nhãn điều hướng đề xuất. Trang là **trang in**, không phải số trang PDF. Số nhóm giữ nguyên các mục đánh số; các biến thể lưu trong cùng mẫu trừ khi có lý do sư phạm được ghi nhận.

| Bài | Chủ đề                              | Trang in bắt đầu | Nhóm mẫu |
| --- | ----------------------------------- | ---------------: | -------: |
| 1   | Thời điểm, ngay sau khi             |                8 |        5 |
| 2   | Đang diễn ra, tiến hành             |               12 |        6 |
| 3   | Sau khi                             |               16 |        5 |
| 4   | Bắt đầu, kết thúc, khoảng thời gian |               20 |        6 |
| 5   | Giới hạn                            |               24 |        4 |
| 6   | Không chỉ, thêm vào đó              |               30 |        5 |
| 7   | Về, đối với                         |               34 |        5 |
| 8   | Căn cứ, tiêu chuẩn                  |               38 |        5 |
| 9   | Liên quan, tương ứng                |               42 |        5 |
| 10  | Liệt kê, ví dụ                      |               46 |        4 |
| 11  | Bất kể, bỏ qua                      |               52 |        5 |
| 12  | Phủ định mạnh, phủ định một phần    |               56 |        5 |
| 13  | Nêu chủ đề                          |               60 |        5 |
| 14  | Nhượng bộ, đối lập                  |               64 |        6 |
| 15  | Giả định, dù cho                    |               68 |        6 |
| 16  | Lý do (1)                           |               74 |        5 |
| 17  | Lý do (2)                           |               78 |        5 |
| 18  | Không thể, khó khăn, khả năng       |               82 |        6 |
| 19  | Góc nhìn đánh giá                   |               86 |        6 |
| 20  | Kết quả                             |               90 |        6 |
| 21  | Nhấn mạnh, nói nhẹ                  |               96 |        6 |
| 22  | Suy đoán                            |              100 |        6 |
| 23  | Cảm tưởng, nhận định                |              104 |        7 |
| 24  | Đề xuất, ý chí                      |              108 |        6 |
| 25  | Cảm xúc mạnh, khó kìm nén           |              112 |        5 |
| 26  | Mong muốn, cảm thán                 |              116 |        6 |

Pilot bài 1 gồm: 際（に）, に際して・にあたって, たとたん（に）, （か）と思うと・（か）と思ったら, か〜ないかのうちに. Mỗi nhóm có ID cố định, không lấy chuỗi tên làm khóa dữ liệu.

## 4. Phạm vi và quyết định mặc định

**Có trong module:** 26 bài phần 1; tìm mẫu theo Nhật/Việt; chi tiết cấu trúc, nghĩa, ngữ cảnh, lưu ý, ví dụ song ngữ; furigana bật/tắt; ba dạng bài tập; gợi ý/xem lời giải; lưu bài làm; tiếp tục học; tiến độ theo bài/mẫu/dạng; thêm mẫu vào FSRS có chống trùng.

**Chưa đưa vào đợt đầu:** audio 5 phút, hội thoại, giáo trình N1/N3, paywall, khóa bài theo thứ tự, AI chấm điểm bắt buộc. Ảnh có các nút này nhưng yêu cầu chính không bắt buộc tất cả. Mọi bài đã xuất bản đều được học tự do. Nội dung chưa duyệt ghi “Đang biên soạn”, không hiển thị ổ khóa giả.

**Số bài tập:** đề xuất pilot 3 câu/dạng/mẫu (5 mẫu × 9 = 45 câu). Mục tiêu bản đầy đủ 10 câu/dạng/mẫu theo tham khảo; nếu danh mục chốt 141 nhóm thì cần 4.230 câu. Đây là khối lượng biên soạn thực, không nhân cùng một câu thành ba bản rồi coi là ba câu độc lập. Bộ đếm luôn lấy số đã duyệt thực tế; không hứa 10 khi mới có 3.

**Chấm dịch:** bản đầu so với đáp án/biến thể đã duyệt và hỗ trợ tự đối chiếu. Không gắn nhãn sai chỉ vì không khớp chuỗi. AI chấm là giai đoạn tùy chọn, cần thiết kế provider, chi phí và dữ liệu gửi đi riêng; không hiển thị nút AI vô tác dụng.

## 5. Sitemap và hành vi màn hình

| Route đề xuất                                                      | Nội dung / hành động chính                                                                    |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `/grammar`                                                         | Chỉ một khóa N2 hiện tại, chuyển tới khóa                                                     |
| `/grammar/n2`                                                      | 26 bài, số mẫu đã đọc/đã luyện, tìm kiếm, tiếp tục học                                        |
| `/grammar/n2/lessons/:lessonId`                                    | Danh sách mẫu, nghĩa ngắn, trạng thái, bài trước/sau                                          |
| `/grammar/n2/patterns/:patternId`                                  | Cấu trúc, giải nghĩa, phạm vi dùng, lưu ý/phân biệt, ví dụ, đánh dấu đã đọc, thêm ôn, làm bài |
| `/grammar/n2/patterns/:patternId/exercises?mode=vi-ja&session=:id` | Ba tab, bài làm lưu được, kiểm tra/gợi ý/lời giải từng câu, tổng kết                          |

Desktop: giữ sidebar và tông xanh Kotoba, danh sách bài hai cột; chi tiết bốn khối thông tin hai cột và ví dụ toàn chiều rộng. Mobile: một cột, tab cuộn ngang có nhãn đầy đủ; không buộc kéo thả. Không sao chép nền ô vuông, linh vật hoặc nhận diện của website khác.

Furigana dùng `<ruby><rt>` từ token đã duyệt; tắt furigana chỉ ẩn cách đọc, không ẩn câu Nhật. Giữ nguyên lựa chọn qua các màn hình. Ví dụ hiển thị câu Nhật và bản dịch Việt rõ ràng; có thể che bản dịch để tự nhớ nhưng mặc định vẫn đọc được.

Mọi màn hình có loading, empty, lỗi kèm thử lại, 404, phiên hết hạn. Quay lại giữ vị trí bài, tab và bản nháp; chuyển tab không nộp bài. Khi lưu thất bại giữ nội dung, thông báo “Chưa lưu” và cho thử lại. Không đổi layout khi xuất hiện furigana/lỗi. Nút biểu tượng phải có tên truy cập; focus nhìn rõ, thông báo kết quả bằng live region.

## 6. Quy tắc bài tập và chấm

### Việt → Nhật

Câu Việt rõ chủ thể, thời điểm, sắc thái; yêu cầu dùng mẫu đang học. Ô nhập tiếng Nhật không chặn IME; Enter trong lúc composition không được nộp. Gợi ý từ khóa/tình huống không lộ toàn câu. Kiểm tra trả về: `matched` (khớp đáp án đã duyệt) hoặc `needs_review` (khác mẫu, cần đối chiếu), không mặc định `incorrect` cho mọi bản dịch khác. Cho xem đáp án mẫu, giải thích và tự đánh giá “Hiểu rồi / Cần ôn”; tự đánh giá không được coi là điểm đúng khách quan.

### Nhật → Việt

Câu Nhật có furigana tùy chọn; bản dịch có nhiều cách diễn đạt. Chuẩn hóa Unicode NFC, khoảng trắng đầu/cuối và dấu câu cho đối chiếu; không bỏ dấu tiếng Việt, phủ định, thì/thể hoặc các từ thể hiện sắc thái. Cùng hợp đồng kết quả như trên. Phản hồi phải phân biệt “đã trả lời”, “khớp mẫu”, “tự đối chiếu”.

### Sắp xếp câu

Bốn mảnh từ có ID riêng, đầu/cuối câu cố định nếu cần; nhấn mảnh để điền, nhấn ô để trả lại, có Làm lại. Hỗ trợ bàn phím; drag/drop chỉ là tiện ích thêm. Server kiểm tra đủ ID, không lặp, không thiếu, thuộc đúng đề và thứ tự thuộc `acceptedOrders`. Các mảnh giống chữ vẫn có ID khác; chấp nhận hoán đổi các ID tương đương khi câu cuối không đổi. Biên tập trước để tránh nhiều trật tự tự nhiên chưa có đáp án.

Mặc định chấm **toàn bộ câu hoàn chỉnh** đúng ý người dùng. Nếu có ★, lưu `starIndex`, hiển thị mảnh ở vị trí đó như giải thích bổ sung; không chỉ chấm ngôi sao rồi bỏ qua phần còn lại. Đây là luyện tập cấu trúc, không tự quy đổi sang điểm chuẩn hóa JLPT.

### Hành vi chung

Mỗi dạng dùng tập câu riêng để hạn chế lộ đáp án qua tab đối diện. Hiển thị số câu từ API. Chỉ enable kiểm tra khi có câu trả lời; chống double submit. Lưu câu trả lời nguyên bản + trạng thái có gợi ý/đã xem đáp án. Xem đáp án trước thì câu được ghi “đã xem”, không tính là lần làm đúng độc lập. Làm lại giữ lịch sử lần trước và tạo lần thử mới. Session lưu tập ID, phiên bản câu, thứ tự mảnh đã trộn; reload không trộn lại.

## 7. Pipeline học liệu

1. Ghi SHA-256 PDF, 235 trang, tên tài liệu; lập manifest 26 bài, nhóm mẫu và trang nguồn. Không áp dụng offset PDF/trang in đồng loạt khi chưa kiểm tra; đã xác minh PDF21 = trang in8.
2. OCR tiếng Nhật theo vùng: tiêu đề, cấu trúc, ví dụ, chú thích; tách furigana khỏi chữ chính. Thử một bài trước để đánh giá sai số, không OCR rồi đưa thẳng vào app.
3. Chuẩn hóa về dữ liệu có kiểu: nhóm mẫu/biến thể, cấu trúc, cách dùng, lưu ý, ví dụ, token furigana, trang nguồn. Chỗ không đọc rõ ghi issue, không đoán.
4. Viết giải thích Việt dễ học, giữ sắc thái và điều kiện gắn mẫu; bổ sung có nguồn gốc `editorial`, tách với nội dung từ PDF. Không dịch máy rồi gắn “đã duyệt”.
5. Biên soạn bài tập riêng theo từng mẫu; ví dụ minh họa khác câu kiểm tra. Mỗi câu có đáp án mẫu, biến thể hợp lệ, giải thích, mục tiêu và người/ngày duyệt.
6. Validator kiểm tra schema, liên kết, ID trùng, số câu, token, đáp án và phạm vi N2. Người review đối chiếu ảnh nguồn + tiếng Nhật tự nhiên; nếu chỉ do agent kiểm tra ghi đúng `agent_reviewed`, không tự gắn `expert_reviewed`.
7. Xuất bản theo lô bài hoàn chỉnh, version bất biến. Nội dung chỉnh sửa tạo revision mới; lịch sử bài làm vẫn gắn revision cũ.

PDF người dùng đưa phục vụ học trong không gian riêng. Không đưa toàn bộ bản scan hoặc học liệu biên dịch vào thư mục public, Git hay gói triển khai công khai; phạm vi xuất bản tài liệu có bản quyền phải được quyết định trước khi public. Không lấy nội dung bị khóa hoặc dùng đáp án trên website làm nguồn ngân hàng.

## 8. Dữ liệu và API

Giữ SQLite, không đổi framework/database chỉ vì thêm module. Dữ liệu học liệu có version lưu JSON trong `content/grammar/n2` và nhập vào DB bằng công cụ kiểm tra; không nhúng đáp án trong bundle frontend. Tách router/service/repository dưới `server/modules/grammar`.

| Bảng dự kiến                 | Trường và ràng buộc chính                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `schema_migrations`          | version duy nhất, applied_at; migration có transaction                                            |
| `grammar_courses`            | id, level, title, content_version, published_at                                                   |
| `grammar_lessons`            | id, course_id FK, ordinal, title_ja/vi, source_pages; unique course+ordinal                       |
| `grammar_patterns`           | id, lesson_id FK, ordinal, slug, active_revision; unique lesson+ordinal                           |
| `grammar_pattern_revisions`  | pattern_id+revision PK, structured_content JSON, source_refs, review_status, reviewer/date        |
| `grammar_exercises`          | id, pattern_id FK, active_revision, mode                                                          |
| `grammar_exercise_revisions` | exercise_id+revision PK, prompt, solutions/rubric/tokens, review_status                           |
| `grammar_progress`           | user_id+pattern_id PK, read_at, last_practiced_at; không lưu % hard-code                          |
| `grammar_sessions`           | id, user_id FK, pattern_id, question/version snapshot, mode, state, created/completed_at          |
| `grammar_responses`          | session_id+question_id+attempt_no unique, raw_answer, result, hints/reveal, saved_at, version     |
| `grammar_srs_links`          | user_id+pattern_id unique, note_id/card_id FK; chống tạo thẻ trùng                                |
| `learning_events`            | id, user_id, source, source_event_id unique theo nguồn, entity_key, UTC time, local_day, evidence |

Nội dung JSON dùng Zod discriminated union `translation_vi_ja | translation_ja_vi | sentence_order`; public DTO tách khỏi solution DTO. Không dùng `any` hoặc ép cast vào questionSchema trắc nghiệm cũ.

API dự kiến (đều cần auth hiện có):

- GET `/api/grammar/courses/n2`: metadata và tiến độ tổng.
- GET `/api/grammar/courses/n2/lessons`: danh sách + số mẫu từ DB.
- GET `/api/grammar/lessons/:id`: mẫu tóm tắt/trạng thái.
- GET `/api/grammar/patterns/:id`: nội dung đã xuất bản, không kèm đáp án bài tập.
- PUT `/api/grammar/patterns/:id/progress`: đánh dấu đã đọc, idempotent.
- POST `/api/grammar/patterns/:id/srs`: tạo/liên kết thẻ trong transaction.
- POST `/api/grammar/patterns/:id/sessions`: tạo hoặc tiếp tục session phù hợp revision.
- GET `/api/grammar/sessions/:id`: bài/response của đúng user, giữ thứ tự.
- PUT `/api/grammar/sessions/:id/responses/:questionId`: autosave, optimistic version; 409 giữ bản local để xử lý.
- POST `.../responses/:questionId/check`, `.../hint`, `.../reveal`: server lưu bằng chứng thao tác, idempotency key.
- POST `/api/grammar/sessions/:id/complete`: tính tổng từ response thật; chưa đủ thì trả trạng thái cần hoàn thành, không tự tạo đáp án.

Index owner+session, user+day, lesson+ordinal, pattern+mode. Giới hạn độ dài câu trả lời, số câu/session, rate limit; kiểm tra sở hữu ở mọi route. Migration bổ sung, không xóa/reseed DB của người dùng. Export thêm tiến độ/response đã làm, không rò đáp án chưa mở. Backup/restore bao gồm revision học liệu tương ứng.

## 9. Tiến độ, FSRS và chỉ số

- **Đã đọc:** người dùng chủ động đánh dấu, không tính chỉ mở trang.
- **Đang luyện:** có ít nhất một câu đã thử.
- **Đã luyện đủ:** đã trả lời và kiểm tra/tự đối chiếu toàn bộ tập câu được giao ở cả ba dạng cho revision đó. Không đồng nghĩa thành thạo.
- **Cần ôn:** từ FSRS hoặc lỗi sắp xếp/lựa chọn tự đánh giá; điểm dịch không tự chuyển thành rating FSRS.
- Khóa hiển thị `x/y mẫu đã đọc`, `a/y mẫu đã luyện đủ`. Khi thêm câu mới, giữ lịch sử hoàn thành cũ và báo nội dung mới; không âm thầm xóa thành tích.
- Heatmap đếm mẫu ngữ pháp duy nhất/ngày qua thao tác học có câu trả lời; làm 30 câu của một mẫu không thành 30 mẫu. “Lượt luyện” là chỉ số riêng.
- Thẻ SRS sinh từ mẫu dùng cùng entity key `grammar:patternId` để không đếm gấp đôi với bài tập cùng ngày. XP giữ nguyên quy tắc 10/kiến thức/ngày hiện có; mở trang, xem đáp án đơn thuần, đánh dấu đã đọc không cộng XP.
- Event ledger bổ sung có unique key, timezone Asia/Ho_Chi_Minh, timestamp UTC; backfill review/quiz cũ idempotent. So sánh số liệu trước/sau để không đổi streak của người dùng.

## 10. Các mốc triển khai

| Mốc | Công việc                                        | Đầu ra / điều kiện qua mốc                                                         |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| M0  | Phân tích và plan                                | Hồ sơ này + rules + tracker; chưa code                                             |
| M1  | Kiểm kê và pilot nội dung bài 1                  | Manifest xác minh, 5 mẫu, 45 câu draft; ảnh nguồn đối chiếu, issue rõ              |
| M2  | Hợp đồng dữ liệu, migration, API                 | Schema + DTO, ownership, seed idempotent, DB cũ còn nguyên                         |
| M3  | Khóa → bài → chi tiết                            | Điều hướng, tìm kiếm, ruby, mobile, loading/error/empty                            |
| M4  | Ba dạng bài tập                                  | Draft/reload, chấm dịch trung thực, full-order, hint/reveal/history                |
| M5  | Progress, FSRS, export                           | Không cộng trùng, không mất lịch sử; dashboard nhất quán                           |
| M6  | Nghiệm thu pilot end-to-end                      | Bài 1 thực sự học/luyện được; không ghi hoàn tất toàn module                       |
| M7  | Biên soạn theo lô 2–5, 6–10, 11–15, 16–20, 21–26 | Mỗi lô qua content QA; cập nhật coverage theo số thực                              |
| M8  | Hoàn thiện ngân hàng và phát hành                | 26 bài, mọi mẫu hợp lệ có 3 dạng; đạt mức câu đã chốt, regression + backup/restore |

M1 → M2 → M3/M4 → M5 → M6 là đường chạy pilot. Khối lượng lớn nhất là OCR/biên tập bài tập M7, không phải dựng trang. Chỉ ước lượng thời gian toàn bộ sau khi đo thời gian xử lý và tỷ lệ lỗi của bài 1; không hứa số ngày không có cơ sở.

## 11. Kiểm thử và tiêu chí nghiệm thu

- Content: 26 lesson ID duy nhất, đối soát số nhóm, không câu thiếu lời giải/source, furigana không lẫn vào text; bản draft không có trong public DTO.
- Translation: đáp án mẫu/biến thể; bản đúng khác mẫu → cần đối chiếu; phủ định và dấu Việt không bị normalize mất; chưa nhập thì không chấm; xem đáp án không thành đúng độc lập.
- Order: thứ tự đúng/sai, duplicate text token, ID giả/lặp/thiếu, acceptedOrders, ★ đúng vị trí, reload giữ shuffle; keyboard/mobile.
- API: user A không đọc/ghi session user B; không lộ solutions qua GET/export; retry không tăng XP; concurrent save409; hết session đăng nhập không mất draft.
- Progress: UTC qua nửa đêm Việt Nam, học lại một mẫu, SRS+câu hỏi cùng ngày, revision thêm câu, backfill chạy hai lần, thống kê cũ không đổi.
- Browser: khóa → bài1 → mẫu → cả3tab → reload → hoàn thành → dashboard → FSRS; test riêng tài khoản mới/rỗng và tài khoản đang có dữ liệu.
- Responsive: 390/768/1280px, không tràn trang, nội dung Nhật/Việt đọc rõ; focus, IME, ruby; kiểm tra console.
- Release: unit/integration pass, typecheck/build/format pass; browser evidence được ghi thực tế. Không gọi suite chưa chạy là đã qua. Backup rồi restore vào DB tạm và đối soát, không thử ghi đè DB thật.

## 12. Việc tiếp theo khi bắt đầu code

Bắt đầu M1: lập manifest đầy đủ đối chiếu PDF, chuẩn hóa 5 mẫu bài1 và thử OCR theo vùng. Đánh giá chất lượng rồi khóa schema nội dung, sau đó M2 tạo migration và API. Không bắt đầu bằng dựng 26 ô bài có số giả hoặc chèn hàng nghìn câu sinh tự động chưa kiểm tra.

Các mặc định có thể điều chỉnh trước code: 141 nhóm theo PDF (sẽ xác minh), học tự do, pilot3 câu/dạng tiến tới10, không AI/audio ở đợt đầu, sắp xếp chấm toàn câu. Nếu không có thay đổi, đây là cơ sở triển khai cho lượt tiếp theo; lượt hiện tại dừng ở kế hoạch theo yêu cầu.
