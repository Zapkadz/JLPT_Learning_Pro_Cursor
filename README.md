# Kotoba — Japanese Learning 1.0

Ứng dụng học tiếng Nhật cho người Việt, chạy full-stack trên máy cá nhân hoặc một máy chủ Node.js. Dữ liệu SQLite lưu bền vững; mỗi tài khoản có bộ thẻ và tiến độ riêng.

## Chạy trên máy này

Yêu cầu Node.js 22+ và npm. Trong thư mục dự án:

```powershell
npm ci
npm run dev
```

Mở http://127.0.0.1:5173, tạo tài khoản cá nhân. API chạy trên cổng 3001. Dữ liệu ở `data/kotoba.sqlite`; không xóa thư mục `data` khi cập nhật. Không có tài khoản/mật khẩu mặc định. Cổng dev chỉ lắng nghe loopback.

## Những gì đã triển khai

- Đăng ký/đăng nhập/đăng xuất, mật khẩu scrypt, session cookie HttpOnly, giới hạn truy cập và kiểm tra quyền từng tài nguyên.
- Tạo, sửa, xóa, tìm bộ thẻ; mẫu hai mặt tùy chỉnh; lưu bản nháp; nhập TXT/CSV/TSV hoặc dán từ Excel, chọn dấu phân cách, preview và báo lỗi.
- Ôn theo FSRS, bắt buộc mở đáp án trước khi đánh giá; lịch từng thẻ, log chống trùng, kiểm soát phiên bản khi nhiều tab cùng sửa.
- Hiragana/Katakana: 46 âm cơ bản, 25 âm đục/bán đục, 33 âm ghép mỗi hệ; bật/tắt romaji và tạo bộ SRS.
- Ba phân môn Kanji/Từ vựng/Ngữ pháp; lọc N5–N1 và dạng câu; 32 câu khởi đầu tự biên soạn; bài tập có snapshot, chọn đáp án, chấm ở server, giải thích và làm lại câu sai.
- Gợi ý câu hỏi cách đọc Kanji từ từ/cách đọc/câu ví dụ; các phương án nhiễu dựa trên biến đổi âm có giải thích. Gợi ý **chưa được sử dụng** cho đến khi người học kiểm tra và đánh dấu xác nhận trong trình sửa thẻ.
- Heatmap, streak theo giờ Việt Nam, lượt học và kiến thức duy nhất tách riêng, XP, mục tiêu và lịch sử kết quả. Xuất JSON dữ liệu cá nhân.

## Phạm vi thực tế

Kho khởi đầu có 32 câu để bắt đầu và kiểm chứng luồng, **không phải giáo trình N5–N1 đầy đủ**. Nhãn cấp độ của câu tự biên soạn là ước lượng nội dung; không phải danh sách từ chính thức. Không chuyển điểm luyện tập sang điểm chuẩn hóa hoặc xác suất đỗ JLPT.

Tự sinh Kanji cần kiểm tra ngôn ngữ; không suy đoán âm on/kun khi chỉ có một Hán tự. Ngữ pháp/Từ vựng dùng ngân hàng câu hỏi hoặc câu khai báo trong học liệu; chưa có mô hình AI sinh tùy ý. Nhập PDF/DOCX/XLSX/OCR, âm thanh có bản quyền, email khôi phục mật khẩu và bộ giáo trình đầy đủ cần bước phát triển tiếp. Đọc hiểu, nghe hiểu, hội thoại để phiên bản sau theo yêu cầu.

Bản này vận hành được cục bộ. Public deployment cần tên miền, HTTPS, email khôi phục, sao lưu định kỳ và review nội dung độc lập. Không có hoạt động gửi email hay dịch vụ AI trả phí.

## Kiến trúc

- `src/pages`: màn hình theo module; `src/components`: UI dùng chung; `src/lib`: API.
- `shared/domain.ts`: schema/validation/import/template/quy tắc cấp; `shared/generate.ts`: gợi ý Kanji; `shared/kana.ts`: bảng âm.
- `server/app.ts`: REST, auth, quyền truy cập, transaction và scheduling; `server/schema.sql`: schema SQLite WAL; `server/content.ts`: học liệu khởi đầu.
- `tests`: unit và API integration; `tests/app.spec.ts`: E2E có thể chạy lại với Playwright.

Mật khẩu/token không xuất ra backup. Session token chỉ lưu hash trong database. Không HTML tùy ý trong mẫu thẻ; React render nội dung như text. API có body limit 2 MB và prepared statements. DB dùng một writer, phù hợp single-server; mở rộng multi-instance cần PostgreSQL và shared rate-limit/job store.

## Kiểm tra

```powershell
npm test
npm run build
npm run format:check
# Tùy chọn, cần Playwright Chromium đã cài và server dev đang chạy:
npm run test:e2e
```

Kết quả kiểm thử trình duyệt thực tế được ghi trong thông tin bàn giao. `test:e2e` là regression suite cho lần chạy sau; không suy ra đã chạy chỉ từ sự tồn tại của tệp.

## Chạy production

```powershell
npm ci
npm run build
$env:NODE_ENV='production'
$env:APP_ORIGIN='https://ten-mien-cua-ban.example'
npm start
```

Reverse proxy HTTPS tới `127.0.0.1:3001`. Production phục vụ cả `dist` và `/api` cùng origin, cookie Secure. Không đặt APP_ORIGIN tùy ý theo header request. Cấu hình rate limit theo IP mặc định thích hợp kết nối trực tiếp; nếu proxy, cấu hình trust proxy theo topology chính xác trước khi mở đăng ký công khai.

Dockerfile đi kèm phục vụ single-server; mount `/app/data`, đặt APP_ORIGIN, kết nối reverse proxy. Docker chưa được chạy trong môi trường hiện tại.

## Sao lưu

```powershell
npm run backup -- 'C:/Backups/kotoba-2026-09-11.sqlite'
```

Lệnh dùng SQLite online backup, không chép riêng file DB trong khi WAL đang ghi. Tệp đích phải chưa tồn tại. Để khôi phục: dừng dịch vụ, giữ lại toàn bộ dữ liệu hiện tại, thử mở backup bằng `PRAGMA integrity_check`, sau đó trỏ DB_PATH tới bản sao của backup và khởi động lại. Không ghi đè dữ liệu hiện có trước khi kiểm tra. Bản backup máy chủ chứa password hash và session hash; bảo quản riêng tư, mã hóa ở nơi lưu, không commit.

## Hồ sơ sản phẩm

- `docs/PRODUCT.md`: Product Vision → Target Users → Core Problems → Feature Set → User Flow → Sitemap → UI System → Database → Technical Architecture → Development Plan.
- `DESIGN.md`, `UX-CONTRACT.md`: quy tắc thiết kế và hành vi dùng chung.
- `docs/design-concept.png`: concept gốc tạo bằng ImageGen.

## Học Ngữ pháp N2 — bài 1

Mở `/grammar/n2/lessons/lesson-01`. Có5 nhóm,150 câu mới (50 Việt→Nhật,50 Nhật→Việt,50 sắp xếp), nội dung tham chiếu PDF người dùng và bài tập tự biên soạn. Trạng thái agent_reviewed, chưa được giáo viên độc lập kiểm duyệt. Các bài2–26 đang biên soạn; mục tiêu141 nhóm/4.230 câu không phải số đã hoàn thành.

Migration bổ sung tự chạy trong transaction, nội dung revision bất biến và có snapshot trong DB. Sửa JSON cần tăng revision; restart server sau chỉnh học liệu. Không import solutions từ content vào frontend. `npm test` đã bao gồm tests/grammar/*.test.ts. Bài dịch khác mẫu cần tự đối chiếu, không có AI chấm giả. Xem docs/grammar-n2/PROGRESS.md cho bằng chứng, giới hạn và bước tiếp.
