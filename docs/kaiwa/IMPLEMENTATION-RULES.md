# Kaiwa — quy tắc triển khai và cập nhật tiến trình

Phạm vi và tiêu chí sản phẩm ở [PLAN.md](./PLAN.md); trạng thái công việc ở [TASKS.md](./TASKS.md).

## 1. Nguyên tắc làm việc

1. Mỗi lượt code nêu task ID, mục tiêu và tiêu chí sẽ kiểm tra. Task lớn tách checklist trước khi sửa.
2. Chỉ đưa task sang DONE khi có chức năng thật, kiểm chứng và bằng chứng. UI dùng dữ liệu giả không hoàn thành backend, export hoặc scoring.
3. Giữ đúng thứ tự: toàn video trước, nhân vật sau. Mọi thay đổi scope/giới hạn/rubric phải cập nhật ADR và tài liệu liên quan.
4. Tận dụng quy tắc hiện có của repo, đặc biệt UX-CONTRACT.md, auth, validation, error/status components. Không tự đổi stack, phiên đăng nhập hoặc thống kê học cũ.
5. Không commit credential, bản thu cá nhân, video người dùng hoặc output lớn. Fixture test phải nhỏ và có quyền dùng, hoặc được tạo bằng script.
6. Không triển khai tự động tách người nói, tách nhạc hay tính điểm tổng chỉ vì giao diện có chỗ trống. Tính năng chưa sẵn sàng cần trạng thái rõ ràng.

## 2. Ranh giới code

- React chỉ phụ trách trình bày và điều phối; recorder engine/state machine, parser và timing utilities tách khỏi component trang.
- Server route kiểm tra auth/input rồi gọi service; service xử lý nghiệp vụ; repository sở hữu truy vấn. Không đưa FFmpeg hoặc provider call dài vào route handler.
- Shared schema định nghĩa discriminated unions cho trạng thái capture/upload/job/assessment. Tránh nhiều boolean có thể mâu thuẫn.
- Timestamp có đơn vị rõ trong tên (`startMs`, `sampleRateHz`); không trộn giây/millisecond/audio samples. Metadata versioned khi thay hợp đồng.
- Dùng migration tương thích dữ liệu cũ, ràng buộc DB và transaction cho bước chuyển trạng thái cần tính nguyên tử. Worker giữ transaction ngắn.
- Backend dùng structured process arguments khi gọi media tools, không ghép shell command bằng filename. Có timeout và cleanup khi cancel.
- Mọi endpoint tài nguyên và job đều kiểm tra owner; không chỉ ẩn nút phía client.

## 3. Tính đúng và tính bền vững

- Source video và raw microphone audio là dữ liệu gốc bất biến; proxy, mix và export là dẫn xuất có version.
- Upload/finalize/export/assessment/activity phải có idempotency thích hợp. Xác định rõ trường hợp retry an toàn, conflict và chưa rõ kết quả.
- “Saved” cần xác nhận server và media hợp lệ; “Complete” cần phân biệt thu hết video với chỉ dừng sớm.
- Tệp tạm được ghi dưới key tạm rồi publish nguyên tử; job bị hủy/xóa phải kiểm tra tombstone trước publish.
- Revision lời thoại đã dùng không bị sửa tại chỗ; thay đổi mới không làm chấm nhầm bản thu cũ.
- Chunk buffer có quota và TTL. Lỗi dung lượng không nuốt thầm; không tự xóa bản thu chưa đồng bộ để nhường chỗ mà không báo.
- Không tăng điểm/XP/streak do render lại trang hoặc retry job. Mọi sự kiện có khóa chống trùng.

## 4. Nội dung và đánh giá tiếng Nhật

- Lưu nguồn, người/loại tác nhân tạo, trạng thái review, version. Draft máy tạo, người dùng duyệt và chuyên gia duyệt là các trạng thái khác nhau.
- Reading theo ngữ cảnh; romaji theo quy ước được ghi rõ; có override bền vững. Không suy nghĩa trực tiếp từ từng Kanji.
- Không gọi ASR confidence là pronunciation accuracy. Không gọi waveform similarity là intonation score.
- Không gán một kết luận âm vị nếu engine không cung cấp bằng chứng đủ chi tiết cho ja-JP.
- Thiếu dữ liệu trả null/status/reason; không trả 0, 100 hoặc số ngẫu nhiên để lấp UI.
- Tách đánh giá lời nói, phát âm, nhịp, ngữ điệu và mức giống diễn xuất. Không chấm giới tính, âm sắc hay độ trầm như năng lực.
- LLM chỉ hỗ trợ diễn giải bằng chứng đã có; không có quyền tự tạo chẩn đoán âm thanh từ chữ.
- Đóng băng bộ held-out trước đánh giá cuối; thay ngưỡng/thuật toán sau khi xem kết quả phải công khai và dùng vòng kiểm chứng mới phù hợp.

## 5. Kiểm thử theo loại thay đổi

| Loại | Kiểm thử cần có |
| --- | --- |
| Parser/schema | Timestamp, Unicode, invalid input, overlap, romaji ngoại lệ, dữ liệu lớn trong hạn mức |
| Backend | Ownership, quota, idempotency, race, migration, worker restart/cancel, cleanup |
| Recorder | State transitions và browser integration; sau đó microphone/codec/clock trên thiết bị thực |
| Media export | Probe/decode, thời lượng, sync đầu/giữa/cuối, gain, tail, dọc/VFR, audio thiếu |
| Scoring | Fixtures chất lượng audio, alignment, unavailable; live provider khi có; benchmark giáo viên và held-out |
| UI | Flow chính, loading/error/offline, keyboard/focus, mobile overflow, ruby và trợ giúp độc lập |
| Tích hợp | Các test hiện có bị ảnh hưởng về auth, stats, grammar, flashcards; không cần chạy lặp mọi suite khi không có thay đổi mới |

Repo hiện có `npm run build`, `npm test`, `npm run test:e2e`. Khi thêm `tests/kaiwa/`, cập nhật script test hoặc gọi explicit để suite mới thực sự chạy; script hiện tại chỉ lấy test gốc và grammar. Không báo “test pass” nếu glob chưa bao gồm test mới.

Test có ý nghĩa phải kiểm tra hành vi và lỗi thực tế; không viết test chỉ để khớp một constant hoặc snapshot toàn trang không có giá trị. Mock dùng cho lỗi provider và UI state, không thay live validation để công bố scoring hoạt động.

## 6. Cập nhật tiến trình

Khi bắt đầu:

- Chuyển đúng task sang IN_PROGRESS, ghi scope/checklist/file/test dự kiến.
- Kiểm tra phụ thuộc; nếu thiếu đầu vào, ghi BLOCKED và tác động thực tế, không giả định đã được cung cấp.

Khi hoàn tất một phần:

- Ghi phần đã làm và phần còn lại. Nếu chỉ có UI, giữ backend/scoring chưa hoàn tất.
- Cập nhật ADR nếu có quyết định mới về capture, storage, provider, rubric hoặc retention.

Khi kết thúc lượt:

- Cập nhật TASKS.md và nhật ký: file thay đổi, kiểm thử đã chạy/kết quả, giới hạn còn lại, task tiếp theo.
- Bằng chứng đặt trong thư mục phù hợp như `docs/kaiwa/evidence/` cho báo cáo nhỏ; không đưa audio cá nhân vào đây.
- Báo người dùng kết quả sử dụng được, lý do quyết định quan trọng, kiểm chứng và việc còn thiếu. Không gắn phần trăm tiến độ toàn dự án bằng số lượng task đơn thuần vì độ lớn khác nhau.

## 7. Definition of Done cho một task

- Đạt acceptance criteria ghi trong backlog và không trái phạm vi sản phẩm.
- Hợp đồng dữ liệu, validation, quyền truy cập và trạng thái lỗi đã được xử lý theo phần việc.
- Có kiểm thử phù hợp và evidence; không còn placeholder được trình bày như tính năng thật.
- Migration/config/run instructions cần thiết đã cập nhật.
- Không gây regression ở chức năng liên quan.
- Rủi ro hoặc phụ thuộc còn lại có tên và trạng thái rõ; nếu ảnh hưởng tiêu chí task thì task chưa DONE.
- Nhật ký và task tiếp theo đã cập nhật.

## 8. Definition of Done cho phát hành

Gate A cần cả luồng thu/xuất thật, quyền riêng tư, backup/restore, giới hạn thiết bị và thông báo khả năng khôi phục trung thực. Gate B cần thêm nội dung chuẩn và phản hồi tiếng Nhật đạt benchmark; không thể thay bằng demo điểm số. Gate C chỉ được bắt đầu thiết kế chi tiết sau khi B ổn định theo kế hoạch hiện tại.

Trước rollout: ghi build/config/migration, backup cần có, feature flag nếu áp dụng, cách rollback và xử lý job đang chạy. Việc có plan không đồng nghĩa đã mua dịch vụ, có giáo viên duyệt hoặc đã deploy.
