# Kaiwa — backlog và tiến trình triển khai

Nguồn phạm vi: [PLAN.md](./PLAN.md). Quy tắc cập nhật: [IMPLEMENTATION-RULES.md](./IMPLEMENTATION-RULES.md).

Ngày cập nhật: 17/09/2026. Mốc A: chưa bắt đầu. Mốc B: chưa bắt đầu. Module hiện chưa có tính năng được nghiệm thu.

KAI-001 DONE — `docs/kaiwa/evidence/KAI-001-integration-audit.md`, ADR-015.
KAI-002 DONE — `docs/kaiwa/evidence/kai-002/` (20s/120s/600s PASS), ADR-016. Next: KAI-003 (parallel-capable) and/or KAI-004 (needs KAI-002).

## Cách đọc

- `TODO`: chưa làm; `IN_PROGRESS`: đang làm; `BLOCKED`: thiếu đầu vào cụ thể; `REVIEW`: có kết quả chờ kiểm tra; `DONE`: đạt tiêu chí và có bằng chứng.
- Cỡ S/M/L là độ lớn tương đối, không phải ngày công: S phạm vi hẹp; M một thành phần; L nhiều thành phần hoặc nghiên cứu bất định. Task L phải chia checklist con trước khi code.
- Vai trò là loại chuyên môn cần thực hiện, không phải người đã được phân công hoặc một agent đã được khởi chạy.
- Phụ thuộc trong bảng là điều kiện nghiệm thu. Có thể chuẩn bị mock/contract sớm nhưng không đánh dấu DONE bằng mock.

## 0. Tài liệu hiện tại

| ID | Hạng mục | Trạng thái | Bằng chứng |
| --- | --- | --- | --- |
| DOC-001 | Kế hoạch tổng thể, scope, kiến trúc, release gates | DONE | PLAN.md |
| DOC-002 | Task, phụ thuộc, đầu ra và tiêu chí nghiệm thu | DONE | Tài liệu này |
| DOC-003 | Quy tắc code, cập nhật tiến trình và bàn giao | DONE | IMPLEMENTATION-RULES.md |

DONE ở đây chỉ áp dụng cho tài liệu, không phải hoàn thành chức năng.

## 1. Chốt thiết kế và thử nghiệm rủi ro

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-001 · M · PM/Architect | Khảo sát điểm tích hợp auth/nav/stats/backup; chốt ADR phạm vi A/B, giới hạn pilot, hợp đồng lỗi, quy tắc dữ liệu riêng tư và retention | PLAN | Có danh sách file/route cần đổi, giới hạn cấu hình, migration/rollback dự kiến, những quyết định còn mở và người chịu trách nhiệm; không đổi hành vi module cũ | DONE |
| KAI-002 · L · Media/Frontend | Spike thu liên tục: codec support, micro, video clock, latency, video 10 phút, EOF, mất thiết bị, chuyển nền | KAI-001 | Có harness và báo cáo đo đầu/giữa/cuối; lựa chọn capture stack/codec/browser ghi thành ADR; đạt hoặc nêu rõ lý do chưa đạt mục tiêu drift; không dựa vào số chunk để tính thời gian | DONE |
| KAI-003 · L · Speech/Japanese | Spike chấm tiếng Nhật: capability thực của provider, F0/nhịp, giới hạn audio, rubric và thiết kế tập đánh giá | KAI-001 | Có mẫu kết quả thật khi có dịch vụ, capability map theo ja-JP, danh sách lỗi được/không được phép kết luận; phương án fallback và đề cương benchmark; thiếu credential được ghi rõ, không giả kết quả | TODO |
| KAI-004 · M · UX/QA | Thiết kế chi tiết các màn hình, recorder states và luồng lỗi theo PLAN; ma trận trình duyệt/thiết bị | KAI-001, KAI-002 | Wireflow/spec gồm desktop/mobile, keyboard, loading/empty/error/offline, lời thông báo mất dữ liệu; không có chọn vai bắt buộc, không dừng sau mỗi câu | TODO |

KAI-003 cần bắt đầu sớm cùng giai đoạn nghiên cứu capture. Đây là quan hệ công việc có thể chạy độc lập, không tự động yêu cầu tạo agent hoặc task mới trong app.

## 2. Nền tảng media và dữ liệu

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-005 · M · Backend | Schema/migration, shared Zod contracts, revision model và repository | KAI-001 | Migration chạy trên DB mới/cũ không mất dữ liệu; owner/FK/unique constraints; attempt giữ đúng revision; kiểm thử conflict khi sửa cùng lúc | TODO |
| KAI-006 · M · Backend | Private storage adapter; quota và lifecycle asset | KAI-005 | File ngoài public root, storage key do server sinh; quota có reservation chống hai upload vượt hạn; rollback giải phóng reservation; GET/HEAD/Range có auth | TODO |
| KAI-007 · L · Backend/Operations | Durable job queue bằng DB, worker riêng, lease/retry/cancel/progress | KAI-005, KAI-006 | Kill worker rồi restart nhận lại job; không publish output hai lần; timeout giải phóng tài nguyên; payload có version; job chết có lỗi đọc được | TODO |
| KAI-008 · M · Backend/Security | Upload nhị phân theo chunk, checksum, status/resume/cancel | KAI-006 | Chunk lặp cùng hash an toàn, khác hash conflict; thiếu chunk không complete; quota, expiry, ownership đúng; JSON limit 2 MB hiện tại không bị nới toàn cục | TODO |
| KAI-009 · M · Media | Probe file và kiểm tra format/codec/duration thật; reject tệp sai | KAI-007, KAI-008 | Tệp giả đuôi, file hỏng, quá dài, thiếu track được xử lý; thông báo phân biệt unsupported với corrupt; process có giới hạn CPU/RAM/time | TODO |
| KAI-010 · L · Media | Pipeline proxy playback, reference audio, thumbnail và timeline mapping | KAI-009 | VFR/rotation/start offset được xử lý; proxy giữ nội dung và thời lượng trong dung sai đã chốt; asset source bất biến; output chỉ ready sau decode/probe thành công | TODO |
| KAI-011 · M · Frontend/QA | UI upload và thư viện, trạng thái job, retry/hủy, playback có Range | KAI-004, KAI-008, KAI-010 | Tải một video thật tới xem được; reload thấy đúng trạng thái; không upload lại toàn bộ khi resume được; video riêng tư không lộ qua URL đoán được | TODO |
| KAI-012 · S · Backend/QA | Bộ fixture media và integration tests cho vertical slice đầu tiên | KAI-011 | Có video ngắn/dài, dọc, im lặng, metadata lạ, hỏng; evidence upload → transcode → playback và restart giữa job; không commit media riêng tư vào repo | TODO |

## 3. Chuẩn bị lời thoại và hỗ trợ tiếng Nhật

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-013 · M · Backend/Frontend | Parser SRT/VTT và editor transcript nhập tay; timeline split/merge | KAI-005, KAI-011 | BOM/CRLF/Unicode/markup/time lỗi được kiểm tra; dữ liệu không làm chạy HTML; không nhận end≤start hoặc ngoài duration; overlap được đánh dấu và xử lý rõ | TODO |
| KAI-014 · M · Japanese/Frontend | Furigana, romaji và dịch Việt chỉnh tay; token model và trợ giúp độc lập | KAI-013 | Reading/romaji có test ngoại lệ; override không mất sau reload; đổi câu Nhật làm lớp phụ thuộc cần review; desktop/mobile ruby không tràn; romaji mặc định tắt | TODO |
| KAI-015 · L · Backend/Speech | Adapter ASR/dịch tự động, job và review workflow; capability/credential UI | KAI-007, KAI-013, KAI-003 | Có đường nhập tay khi chưa cấu hình; kết quả tự động là draft; không đè bản chỉnh mới hơn; lỗi/timeout/quota không mất dữ liệu; test live có ghi provider/version/cost khi được cấu hình | TODO |
| KAI-016 · M · Frontend/QA | Màn hình chuẩn bị học, transcript đồng bộ, publish revision cho lần thu | KAI-014 | Click câu tua video đúng; ba lớp trợ giúp độc lập; session dùng snapshot bất biến; video không transcript vẫn thu được và thông báo chưa đủ chuẩn chấm | TODO |

KAI-015 có thể hoàn tất sau mốc A nếu provider chưa sẵn sàng; vẫn bắt buộc cho mục tiêu tự động hóa ở B. Không để nó chặn lồng tiếng với phụ đề nhập tay.

## 4. Thu toàn video, xem lại và xuất

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-017 · M · Frontend/Media | Micro preflight: xin quyền, chọn thiết bị, meter, thử thu/nghe và capability check | KAI-002, KAI-004 | Permission denied/no device/device disconnect có đường xử lý; mic track dừng khi rời; meter không tự phát ra loa; không gửi thử mic tới provider ngoài | TODO |
| KAI-018 · L · Frontend/Media | Recorder state machine, countdown và capture liên tục đồng bộ video | KAI-016, KAI-017 | Thu từ đầu tới EOF không dừng theo câu; khóa seek/rate; timestamp mapping đúng; dừng sớm/interruption phân biệt completed; chống double start/double finalize | TODO |
| KAI-019 · L · Frontend/Backend | Journal chunk trong IndexedDB, upload nền/resume, giới hạn buffer và recover | KAI-002, KAI-008, KAI-018 | Test mất mạng/đóng tab/quota đầy; checksum/order đúng; biết phần nào server đã nhận; chỉ hứa recovery đã thử trên codec thực; dữ liệu không giải mã được không báo saved | TODO |
| KAI-020 · L · Backend/Media | Finalize take, ghép/remux, kiểm tra decode/duration và lưu bản thu | KAI-007, KAI-019 | Idempotent finalize; thiếu chunk có lỗi; dữ liệu hợp lệ phát được đầu/giữa/cuối; thiếu tail sau interruption được ghi đúng; không trộn tiếng mẫu vào raw mic track | TODO |
| KAI-021 · M · Frontend | Trang nghe lại, gain tiếng gốc/giọng mình, lịch sử take và chọn bản giữ | KAI-020 | Nghe toàn video đúng sync; cấu hình mix lưu được; thu lại không ghi đè take cũ; refresh quay lại đúng take; không có slider nhạc riêng nếu không có track riêng | TODO |
| KAI-022 · L · Media/Backend/QA | Job xuất MP4 và download riêng tư; snapshot mix | KAI-021 | File MP4 phát được, thời lượng/gain/offset đúng với preview; không cắt chữ cuối; test nguồn mute/dọc/VFR; restart/retry không nhân output; export không phụ thuộc job scoring | TODO |

Tại KAI-022 có luồng sản phẩm cốt lõi, nhưng chưa phát hành A trước KAI-031–033.

## 5. Chấm phát âm, nhịp và ngữ điệu

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-023 · L · Japanese/Speech/PM | Thu thập benchmark được phép sử dụng; rubric; hai người đánh giá; ngân sách và dữ liệu gửi provider | KAI-003 | Dataset manifest có nguồn/quyền dùng, train/calibration/held-out tách theo người nói; nhãn và bất đồng có xử lý; ngưỡng coverage/false feedback/cost được chốt trước đánh giá cuối | TODO |
| KAI-024 · M · Speech/Backend | Quality gate audio: silence/clipping/noise/reference leakage và vùng không chấm | KAI-020, KAI-023 | Test im lặng/loa phát mẫu/nhiễu/chồng giọng; tình huống không đủ tin cậy trả unavailable/reason, không biến thành điểm phát âm 0; không coi phát mẫu qua loa là người học hoàn thành | TODO |
| KAI-025 · L · Speech/Media | Căn chỉnh utterance với bản thu, padding, phân biệt missing speech và data gap | KAI-024, KAI-016 | Bảo toàn sample/timeline offsets; không cắt đầu/cuối âm tiết; câu quá dài được chia có ngữ cảnh; uncertain alignment không sinh lỗi khẳng định; mapping về video nghe A/B đúng | TODO |
| KAI-026 · L · Speech/Backend | Adapter pronunciation ja-JP, evidence schema và phản hồi phát âm | KAI-025, KAI-003 | Xác minh field thực sự có cho tiếng Nhật; parse/provider timeout/retry/budget test; không dùng ASR confidence làm pronunciation score; live output kiểm tra với benchmark | TODO |
| KAI-027 · L · Speech/Japanese | Nhịp và intonation: F0 tương đối, voiced confidence, timing, calibration | KAI-025, KAI-023 | Không phạt khác giới tính/âm sắc/cao độ tuyệt đối; không kéo giãn che trường âm sai; ngắt vùng vô thanh; báo cáo đối chiếu giáo viên; không gắn nhãn pitch accent chuẩn nếu chỉ đo contour | TODO |
| KAI-028 · M · Backend | Tổng hợp assessment theo version/rubric, coverage, cache và idempotency | KAI-026, KAI-027 | Không có dữ liệu là null/reason; aggregate chỉ trên vùng hợp lệ và công khai coverage; request lặp không tự trừ phí; không ghi đè assessment cũ khác version | TODO |
| KAI-029 · M · Frontend/Japanese | UI phản hồi tiếng Việt, tối đa 1–3 ưu tiên, timestamp và so sánh A/B | KAI-021, KAI-028 | Mỗi nhận xét trỏ đúng bằng chứng/nghe lại; có text thay biểu đồ; provider fail vẫn nghe/xuất được; lời giải thích không bịa bằng transcript; tiến bộ chỉ so điều kiện tương thích | TODO |

Không đánh dấu KAI-027 DONE chỉ vì đã vẽ được đường cao độ. DONE cần xác nhận bằng tập dữ liệu và ngưỡng đã ghi ở KAI-023; KAI-034 kiểm tra lại trên tập giữ lại trước release B.

## 6. Tích hợp, vận hành và phát hành

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-030 · M · Backend/Frontend | Lịch sử và tiến độ Kaiwa; ADR streak/XP/mục tiêu riêng | KAI-020; KAI-024 cho metric nói tự động | Có lịch sử take ngay ở A; active speaking/XP chỉ bật sau chất lượng dữ liệu đủ; retry không đếm lại; test qua nửa đêm theo múi giờ; không sửa nghĩa số thẻ/ngữ pháp đã học | TODO |
| KAI-031 · L · Operations/Backend | Media backup/restore, quota cleanup, xóa đồng bộ job/assets, logging/metrics và config | KAI-006, KAI-007, KAI-022 | Restore DB + media chạy được; xóa lúc job đang chạy không hồi sinh tệp; log không chứa audio/token; có cảnh báo disk/queue; retention được ghi trong hướng dẫn | TODO |
| KAI-032 · L · QA/Security | Security/accessibility/responsive QA; auth, ownership, file abuse, keyboard, lỗi mạng | KAI-011, KAI-016, KAI-022, KAI-031 | Test hai tài khoản, path traversal, MIME giả, quota/rate-limit, HTML phụ đề; focus/keyboard/ruby/mobile đúng; chạy regression module cũ phù hợp | TODO |
| KAI-033 · L · QA/PM | Gate A: thiết bị thực, full flow, crash recovery, sync và export; tài liệu sử dụng | KAI-012, KAI-017–022, KAI-030–032 | Checklist A có evidence trên từng môi trường công bố hỗ trợ; không lỗi chặn; manual import hoạt động không cần API; trạng thái scoring chưa có được nói rõ; release/rollback notes đầy đủ | TODO |
| KAI-034 · L · Japanese/QA/PM | Gate B: đánh giá độc lập, cost/load/provider outage, UX học và bàn giao | KAI-015, KAI-023–029, KAI-033 | Báo cáo held-out đạt ngưỡng đã chốt, gồm false feedback và coverage; giáo viên duyệt; không lỗi nghiêm trọng chưa xử lý; giới hạn được ghi; scoring thật trên video user, không chỉ fixture | TODO |

KAI-030 có hai checklist: lịch sử ở A; thời gian nói/XP dựa trên phân tích ở B. Gate A chỉ yêu cầu checklist lịch sử đạt, không bắt metric giả để mở khóa phát hành. Tracker chi tiết phải tách chúng thành KAI-030a/KAI-030b khi bắt đầu task.

## 7. Đợt sau

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-035 · L · PM/Media/Speech | Lập đặc tả đóng vai một nhân vật: speaker annotation, giữ lời vai còn lại, overlap và giới hạn tách nguồn | Gate B | Kế hoạch riêng dùng lại asset/revision/attempt; thử khả năng giữ lời người khác trước khi hứa sản phẩm; không cài đặt như điều kiện ngầm của bản đầu | TODO |

## 8. Checklist task đang làm

Chưa có task code đang làm. Task tiếp theo: **KAI-001**.

Khi bắt đầu một task, thêm mục theo mẫu:

```text
Task: KAI-xxx — tên
Trạng thái: IN_PROGRESS
Mục tiêu và phạm vi:
Checklist con:
Phụ thuộc đã đủ / còn thiếu:
File dự kiến thay đổi:
Quyết định kỹ thuật và lý do:
Kiểm thử dự kiến:
Kết quả và đường dẫn bằng chứng:
Rủi ro còn lại:
Task tiếp theo:
```

## 9. Nhật ký tiến trình

| Ngày | Thay đổi | Kiểm chứng | Việc tiếp theo |
| --- | --- | --- | --- |
| 17/09/2026 | Tạo plan/backlog/rules; xác định lồng tiếng liên tục là ưu tiên; tách gate A/B/C | Đọc stack/middleware/backup hiện tại và tài liệu media/pronunciation; chưa chạy hoặc triển khai module | KAI-001 rồi KAI-002; khởi động nghiên cứu KAI-003 sớm |

## 10. Điều kiện bên ngoài cần quản lý

- Provider/credentials và ngân sách: chỉ chặn live test phụ thuộc dịch vụ, không chặn upload, transcript thủ công, thu và export.
- Người duyệt tiếng Nhật và dữ liệu có quyền sử dụng: cần cho benchmark và gate B. Nội dung chưa duyệt không được đổi nhãn thành verified.
- Thiết bị thực: cần cho từng môi trường công bố hỗ trợ thu. Browser automation không thay cho thử microphone và clock thật.
- Chính sách lưu trữ/xóa/backup: phải chốt trước gate A, không đợi phát hành mới xử lý.
- Nếu có blocker, ghi chính xác task bị chặn và tiếp tục task độc lập. Không đánh dấu toàn dự án BLOCKED khi vẫn còn việc trong phạm vi được làm.
