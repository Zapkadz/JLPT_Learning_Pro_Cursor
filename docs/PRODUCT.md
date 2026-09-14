# Kotoba — đặc tả sản phẩm 1.0

## Product Vision

Một không gian học tiếng Nhật cá nhân: biến tài liệu của người học thành kiến thức nhớ được và sử dụng đúng trong ngữ cảnh. Vòng lặp chính: thêm kiến thức → tự gợi nhớ → ôn đúng hạn → kiểm tra khả năng phân biệt → điều chỉnh việc học.

## Target Users

- Người Việt tự học N5–N3: cần cấu trúc, hướng dẫn cách tự đánh giá, ít thao tác.
- Người học N2–N1: cần nhập bộ tài liệu riêng, luyện nhầm lẫn tinh tế và xem lỗi.
- Người bắt đầu: học kana trước khi dựa vào romaji; romaji chỉ hiện sau khi gợi nhớ.

## Core Problems

Học lại từ đã biết quá nhiều; quên từ cũ; nhập thẻ thủ công chậm; chọn đáp án theo hình dạng thay vì nhớ; câu hỏi tự sinh có nhiều đáp án đúng; chỉ số tiến độ gây hiểu nhầm. North-star: số ngày có ít nhất một lượt gợi nhớ và số kiến thức duy nhất đã thực hành. Không tuyên bố “thành thạo” từ một lượt đúng.

## Feature Set

P0: tài khoản riêng, bộ thẻ thủ công và nhập văn bản/TXT/CSV/TSV, preview và lỗi theo dòng, mẫu thẻ mặt trước/mặt sau, nội dung tiếng Nhật/cách đọc/nghĩa/ví dụ, FSRS phía server, bốn mức tự đánh giá, hàng đợi đến hạn, luyện Kanji/Từ vựng/Ngữ pháp riêng, kana, heatmap, mục tiêu ngày, lịch sử kết quả, xuất dữ liệu cá nhân.

P1: kho kiến thức N5→N1 do biên tập viên duyệt, nhập PDF/DOCX/XLSX qua job extraction và màn hình hiệu chỉnh, OCR có confidence, quản trị nội dung, quên mật khẩu qua email, kiểm duyệt nâng cao, phát âm có bản quyền, tối ưu tham số FSRS từ lịch sử, backup tự động và restore có diễn tập. Chỉ cung cấp định dạng đã xử lý đáng tin trong bản hiện hành.

P2: đọc hiểu, nghe hiểu, hội thoại; bổ sung sau theo yêu cầu. Không đưa nút rỗng vào luồng học.

## User Flow

Đăng ký/đăng nhập → tổng quan rỗng có hướng dẫn → tạo bộ thẻ hoặc thêm bộ khởi đầu → preview → lưu → ôn → nghĩ đáp án → lật → Quên/Khó/Được/Dễ → server lưu lịch mới → tiến độ.

Nhập học liệu → map trường bằng dấu phân cách → xem lỗi/trùng → lưu. Với đề: chọn phân môn + cấp độ + bộ dữ liệu → xem số câu đủ điều kiện → làm câu hỏi → nộp → lời giải + phân tích lỗi → ôn lại câu sai. Không tự đưa kết quả trắc nghiệm thành đánh giá FSRS.

## Sitemap & screens

`/` Tổng quan; `/decks` bộ thẻ, tìm kiếm; `/decks/new` trình soạn; `/decks/:id` chi tiết/chỉnh sửa; `/review` ôn; `/kana` bảng âm; `/practice` chọn phân môn/cấp độ/nguồn; phiên làm bài và kết quả trong màn hình luyện tập; `/progress` heatmap/lịch sử/thống kê; `/settings` mục tiêu/cấp độ/retention/xuất dữ liệu; `/login` đăng nhập/đăng ký. Màn hình lỗi và trang không tìm thấy giữ điều hướng.

## UI System

Xem DESIGN.md và UX-CONTRACT.md. UI tiếng Việt, ví dụ Nhật có lang=ja. Desktop sidebar cố định, tablet sidebar gọn, mobile điều hướng cuộn ngang và nội dung một cột. Focus hiển thị, nút ≥44px, trạng thái lỗi có văn bản. Không hiển thị lịch sử học giả.

## Learning model

Một note là kiến thức, card là cách hỏi. Mỗi card giữ lịch FSRS riêng. Template dùng placeholder an toàn `{term}`, `{reading}`, `{meaning}`, `{example}`; không cho HTML/JS. Mặt trước không hiện đáp án; trước khi tự đánh giá phải mở mặt sau. Quên = không nhớ, Khó = nhớ nhưng khó, Được = nhớ đúng, Dễ = nhớ nhanh. FSRS qua thư viện ts-fsrs, retention mặc định 0.90; lịch lưu UTC, ngày hoạt động tính Asia/Ho_Chi_Minh. Học lại được giữ đúng lịch; không tráo “Khó” thành “Quên”. Lượt ôn là append-only có key chống lặp và version chống ghi đè.

## JLPT pedagogy & generation

Kanji reading có mọi cấp; orthography N5–N2, không có N1. Từ vựng: contextual expressions và paraphrases mọi cấp; usage N4–N1; word formation chỉ N2. Ngữ pháp: chọn dạng, sắp xếp câu ★, ngữ pháp văn bản mọi cấp. Đọc hiểu dài là module sau; text grammar vẫn là dạng ngữ pháp.

Không hỏi cách đọc một chữ đa âm đứng riêng rồi coi một âm là duy nhất. Câu stem phải khóa từ/biến thể trong ngữ cảnh. Distractor gắn với nhầm trường âm, âm ghép nhỏ, âm ngắt, hữu thanh, on/kun hoặc hình tự; phải có 4 lựa chọn khác nhau, chính xác một đáp án đã biên tập. Không áp dụng thay âm cơ học lên mọi từ, không dùng đáp án đúng biến thể làm bẫy. Mỗi distractor có lời giải tại sao sai. Bản đầu sinh phiên đề từ câu đã khai báo đầy đủ trong học liệu hoặc ngân hàng khởi đầu; không bịa câu/lời giải từ Kanji đơn lẻ. Nhập tùy ý không đủ dữ kiện vẫn học flashcard được và hiển thị thiếu điều kiện tạo đề.

Mẫu nhập có cột question, option1–4, answer (1–4), explanation; phải có trường câu hỏi, bốn đáp án và lời giải. Dữ liệu người dùng tự khai báo không được quảng bá là đã kiểm duyệt. Bộ mẫu là nội dung tự biên soạn, không sao chép đề. Điểm hiển thị số đúng/tổng; không chuyển sang thang điểm chuẩn hóa JLPT hoặc dự đoán đỗ.

## Gamification

Heatmap là số kiến thức duy nhất được ôn hoặc câu hỏi được làm trong ngày, thống kê lượt học tách riêng. Streak = ngày có hoạt động thực, hôm nay chưa học vẫn giữ chuỗi kết thúc hôm qua. Không đếm việc mở app/tạo thẻ. XP khuyến khích thực hành có giới hạn mỗi kiến thức/ngày; level là tiến độ ứng dụng, không phải trình độ JLPT. Mục tiêu ngày 5–200 lượt. Thành tích cột mốc học thật; không leaderboard ở v1.

## Database

SQLite WAL cho triển khai đơn máy: users, sessions, decks, notes, cards, reviews, attempts. users 1:N decks 1:N notes 1:N cards; users 1:N reviews; reviews N:1 cards; attempts chứa snapshot câu hỏi và câu trả lời. Unique email, session token chỉ lưu hash; FK cascade; index owner/due và activity. Nội dung JSON có validation Zod, version lịch để chống xung đột. Mọi query dữ liệu cá nhân giới hạn owner. Migration `server/schema.sql`; lịch FSRS đầy đủ dạng JSON.

## Technical Architecture

React + TypeScript + Vite → cùng origin Express REST → services FSRS/import/question → SQLite. Lựa chọn này chạy được trên máy hiện tại, không phụ thuộc tài khoản dịch vụ. Authentication scrypt salt ngẫu nhiên, cookie HttpOnly SameSite=Strict, hạn 30 ngày, production Secure + HTTPS. Origin check cho mutation, body limit, rate limit auth/API, Helmet CSP, prepared statements, kiểm tra quyền mọi đối tượng. Không lưu token ở localStorage. Khi mở rộng đa instance: PostgreSQL, migration có kiểm soát, Redis cho rate limit/job, object storage cho tệp, worker extraction, nội dung phiên bản hóa.

API: POST auth/register|login|logout; GET me; GET/POST decks; GET/PUT/DELETE decks/:id; POST starters/:id; GET review; POST review/:id; GET stats; PUT settings; POST practice; POST practice/:id/submit; GET attempts; GET export. Server chấm điểm; client không nhận answer trước khi nộp. Phiên đề lưu snapshot tránh nội dung thay đổi giữa phiên.

## Development Plan & release gates

1. Nền tảng, schema, auth, seed kiến thức.
2. Soạn/nhập/export và templates, kiểm tra dữ liệu.
3. FSRS, queue, review log, concurrency/idempotency.
4. Bộ câu hỏi tách môn/cấp, chấm điểm, lịch sử.
5. Kana, heatmap/streak/settings và responsive.
6. Unit/integration/E2E, kiểm tra quyền truy cập, build, audit UI.
7. Trước public: tên miền/HTTPS, secret/runtime config, backup + restore, email reset, vận hành rate limit phân tán nếu scale, review ngôn ngữ độc lập và bổ sung kho N5–N1 đầy đủ. Không gọi bộ khởi đầu là giáo trình đầy đủ.

## Sources (checked 2026-09-11)

- https://www.jlpt.jp/e/guideline/testsections.html — bảng dạng câu theo cấp.
- https://www.jlpt.jp/e/samples/forlearners.html — câu mẫu theo dạng.
- https://docs.ankiweb.net/deck-options.html#fsrs — retention và scheduling.
- https://docs.ankiweb.net/studying.html — active recall và bốn mức trả lời.
- https://github.com/open-spaced-repetition/ts-fsrs — triển khai FSRS TypeScript.

### Gợi ý Kanji đã triển khai

Với từ Kanji có một cách đọc hiragana và câu ví dụ chứa từ đó, ứng dụng có thể đề xuất câu hỏi cách đọc cùng bẫy âm ngắt, trường âm, âm ghép nhỏ và hữu thanh/vô thanh. Đây là bản nháp theo quy tắc, không phải câu hỏi đã được chuyên gia kiểm duyệt. Từng câu phải được người dùng kiểm tra và xác nhận trước khi xuất hiện trong bài luyện; trường hợp thiếu ngữ cảnh hoặc không đủ ba phương án phân biệt sẽ không tự sinh. Từ vựng và ngữ pháp hiện dùng ngân hàng mẫu hoặc câu hỏi nhập đầy đủ; sinh câu mới từ tài liệu tùy ý thuộc giai đoạn mở rộng.
