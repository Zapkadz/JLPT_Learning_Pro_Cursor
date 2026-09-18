# Kaiwa — backlog và tiến trình triển khai

Nguồn phạm vi: [PLAN.md](./PLAN.md). Quy tắc cập nhật: [IMPLEMENTATION-RULES.md](./IMPLEMENTATION-RULES.md).

Ngày cập nhật: 18/09/2026. Mốc A: **ACCEPTED** (KAI-046). **ADR-020** v1/v2 shipped; **ADR-021** forced-align v1 redesign = KAI-065+ (**IN_PROGRESS** đợt 1).

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
| KAI-003 · L · Speech/Japanese | Spike chấm tiếng Nhật: capability thực của provider, F0/nhịp, giới hạn audio, rubric và thiết kế tập đánh giá | KAI-001 | Có mẫu kết quả thật khi có dịch vụ, capability map theo ja-JP, danh sách lỗi được/không được phép kết luận; phương án fallback và đề cương benchmark; thiếu credential được ghi rõ, không giả kết quả | DONE |
| KAI-004 · M · UX/QA | Thiết kế chi tiết các màn hình, recorder states và luồng lỗi theo PLAN; ma trận trình duyệt/thiết bị | KAI-001, KAI-002 | Wireflow/spec gồm desktop/mobile, keyboard, loading/empty/error/offline, lời thông báo mất dữ liệu; không có chọn vai bắt buộc, không dừng sau mỗi câu | DONE |

KAI-003 cần bắt đầu sớm cùng giai đoạn nghiên cứu capture. Đây là quan hệ công việc có thể chạy độc lập, không tự động yêu cầu tạo agent hoặc task mới trong app.

## 2. Nền tảng media và dữ liệu

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-005 · M · Backend | Schema/migration, shared Zod contracts, revision model và repository | KAI-001 | Migration chạy trên DB mới/cũ không mất dữ liệu; owner/FK/unique constraints; attempt giữ đúng revision; kiểm thử conflict khi sửa cùng lúc | DONE |
| KAI-006 · M · Backend | Private storage adapter; quota và lifecycle asset | KAI-005 | File ngoài public root, storage key do server sinh; quota có reservation chống hai upload vượt hạn; rollback giải phóng reservation; GET/HEAD/Range có auth | DONE |
| KAI-007 · L · Backend/Operations | Durable job queue bằng DB, worker riêng, lease/retry/cancel/progress | KAI-005, KAI-006 | Kill worker rồi restart nhận lại job; không publish output hai lần; timeout giải phóng tài nguyên; payload có version; job chết có lỗi đọc được | DONE |
| KAI-008 · M · Backend/Security | Upload nhị phân theo chunk, checksum, status/resume/cancel | KAI-006 | Chunk lặp cùng hash an toàn, khác hash conflict; thiếu chunk không complete; quota, expiry, ownership đúng; JSON limit 2 MB hiện tại không bị nới toàn cục | DONE |
| KAI-009 · M · Media | Probe file và kiểm tra format/codec/duration thật; reject tệp sai | KAI-007, KAI-008 | Tệp giả đuôi, file hỏng, quá dài, thiếu track được xử lý; thông báo phân biệt unsupported với corrupt; process có giới hạn CPU/RAM/time | DONE |
| KAI-010 · L · Media | Pipeline proxy playback, reference audio, thumbnail và timeline mapping | KAI-009 | VFR/rotation/start offset được xử lý; proxy giữ nội dung và thời lượng trong dung sai đã chốt; asset source bất biến; output chỉ ready sau decode/probe thành công | DONE |
| KAI-011 · M · Frontend/QA | UI upload và thư viện, trạng thái job, retry/hủy, playback có Range | KAI-004, KAI-008, KAI-010 | Tải một video thật tới xem được; reload thấy đúng trạng thái; không upload lại toàn bộ khi resume được; video riêng tư không lộ qua URL đoán được | DONE |
| KAI-012 · S · Backend/QA | Bộ fixture media và integration tests cho vertical slice đầu tiên | KAI-011 | Có video ngắn/dài, dọc, im lặng, metadata lạ, hỏng; evidence upload → transcode → playback và restart giữa job; không commit media riêng tư vào repo | DONE |

## 3. Chuẩn bị lời thoại và hỗ trợ tiếng Nhật

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-013 · M · Backend/Frontend | Parser SRT/VTT và editor transcript nhập tay; timeline split/merge | KAI-005, KAI-011 | BOM/CRLF/Unicode/markup/time lỗi được kiểm tra; dữ liệu không làm chạy HTML; không nhận end≤start hoặc ngoài duration; overlap được đánh dấu và xử lý rõ | DONE |
| KAI-014 · M · Japanese/Frontend | Furigana, romaji và dịch Việt chỉnh tay; token model và trợ giúp độc lập | KAI-013 | Reading/romaji có test ngoại lệ; override không mất sau reload; đổi câu Nhật làm lớp phụ thuộc cần review; desktop/mobile ruby không tràn; romaji mặc định tắt | DONE |
| KAI-015 · L · Backend/Speech | Adapter ASR/dịch tự động, job và review workflow; capability/credential UI | KAI-007, KAI-013, KAI-003 | Có đường nhập tay khi chưa cấu hình; kết quả tự động là draft; không đè bản chỉnh mới hơn; lỗi/timeout/quota không mất dữ liệu; test live có ghi provider/version/cost khi được cấu hình | DONE (not_configured stub); live adapter TODO |
| KAI-016 · M · Frontend/QA | Màn hình chuẩn bị học, transcript đồng bộ, publish revision cho lần thu | KAI-014 | Click câu tua video đúng; ba lớp trợ giúp độc lập; session dùng snapshot bất biến; video không transcript vẫn thu được và thông báo chưa đủ chuẩn chấm | DONE |

KAI-015 có thể hoàn tất sau mốc A nếu provider chưa sẵn sàng; vẫn bắt buộc cho mục tiêu tự động hóa ở B. Không để nó chặn lồng tiếng với phụ đề nhập tay.

## 4. Thu toàn video, xem lại và xuất

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-017 · M · Frontend/Media | Micro preflight: xin quyền, chọn thiết bị, meter, thử thu/nghe và capability check | KAI-002, KAI-004 | Permission denied/no device/device disconnect có đường xử lý; mic track dừng khi rời; meter không tự phát ra loa; không gửi thử mic tới provider ngoài | DONE |
| KAI-018 · L · Frontend/Media | Recorder state machine, countdown và capture liên tục đồng bộ video | KAI-016, KAI-017 | Thu từ đầu tới EOF không dừng theo câu; khóa seek/rate; timestamp mapping đúng; dừng sớm/interruption phân biệt completed; chống double start/double finalize | DONE |
| KAI-019 · L · Frontend/Backend | Journal chunk trong IndexedDB, upload nền/resume, giới hạn buffer và recover | KAI-002, KAI-008, KAI-018 | Test mất mạng/đóng tab/quota đầy; checksum/order đúng; biết phần nào server đã nhận; chỉ hứa recovery đã thử trên codec thực; dữ liệu không giải mã được không báo saved | DONE |
| KAI-020 · L · Backend/Media | Finalize take, ghép/remux, kiểm tra decode/duration và lưu bản thu | KAI-007, KAI-019 | Idempotent finalize; thiếu chunk có lỗi; dữ liệu hợp lệ phát được đầu/giữa/cuối; thiếu tail sau interruption được ghi đúng; không trộn tiếng mẫu vào raw mic track | DONE |
| KAI-021 · M · Frontend | Trang nghe lại, gain tiếng gốc/giọng mình, lịch sử take và chọn bản giữ | KAI-020 | Nghe toàn video đúng sync; cấu hình mix lưu được; thu lại không ghi đè take cũ; refresh quay lại đúng take; không có slider nhạc riêng nếu không có track riêng | DONE |
| KAI-022 · L · Media/Backend/QA | Job xuất MP4 và download riêng tư; snapshot mix | KAI-021 | File MP4 phát được, thời lượng/gain/offset đúng với preview; không cắt chữ cuối; test nguồn mute/dọc/VFR; restart/retry không nhân output; export không phụ thuộc job scoring | DONE |

Tại KAI-022 có luồng sản phẩm cốt lõi, nhưng chưa phát hành A trước KAI-031–033.

## 5. Chấm phát âm, nhịp và ngữ điệu

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-023 · L · Japanese/Speech/PM | Thu thập benchmark được phép sử dụng; rubric; hai người đánh giá; ngân sách và dữ liệu gửi provider | KAI-003 | Dataset manifest có nguồn/quyền dùng, train/calibration/held-out tách theo người nói; nhãn và bất đồng có xử lý; ngưỡng coverage/false feedback/cost được chốt trước đánh giá cuối | TODO |
| KAI-024 · M · Speech/Backend | Quality gate audio: silence/clipping/noise/reference leakage và vùng không chấm | KAI-020, KAI-023 | Test im lặng/loa phát mẫu/nhiễu/chồng giọng; tình huống không đủ tin cậy trả unavailable/reason, không biến thành điểm phát âm 0; không coi phát mẫu qua loa là người học hoàn thành | DONE (provisional; leakage/decode deferred) |
| KAI-025 · L · Speech/Media | Căn chỉnh utterance với bản thu, padding, phân biệt missing speech và data gap | KAI-024, KAI-016 | Bảo toàn sample/timeline offsets; không cắt đầu/cuối âm tiết; câu quá dài được chia có ngữ cảnh; uncertain alignment không sinh lỗi khẳng định; mapping về video nghe A/B đúng | DONE (synthetic timeline; live ASR force-align deferred) |
| KAI-026 · L · Speech/Backend | Adapter pronunciation ja-JP, evidence schema và phản hồi phát âm | KAI-025, KAI-003 | Xác minh field thực sự có cho tiếng Nhật; parse/provider timeout/retry/budget test; không dùng ASR confidence làm pronunciation score; live output kiểm tra với benchmark | DONE (schema+stub); live field verify + benchmark TODO |
| KAI-027 · L · Speech/Japanese | Nhịp và intonation: F0 tương đối, voiced confidence, timing, calibration | KAI-025, KAI-023 | Không phạt khác giới tính/âm sắc/cao độ tuyệt đối; không kéo giãn che trường âm sai; ngắt vùng vô thanh; báo cáo đối chiếu giáo viên; không gắn nhãn pitch accent chuẩn nếu chỉ đo contour | DONE (provisional local F0); teacher/KAI-023 calibration TODO |
| KAI-028 · M · Backend | Tổng hợp assessment theo version/rubric, coverage, cache và idempotency | KAI-026, KAI-027 | Không có dữ liệu là null/reason; aggregate chỉ trên vùng hợp lệ và công khai coverage; request lặp không tự trừ phí; không ghi đè assessment cũ khác version | DONE |
| KAI-029 · M · Frontend/Japanese | UI phản hồi tiếng Việt, tối đa 1–3 ưu tiên, timestamp và so sánh A/B | KAI-021, KAI-028 | Mỗi nhận xét trỏ đúng bằng chứng/nghe lại; có text thay biểu đồ; provider fail vẫn nghe/xuất được; lời giải thích không bịa bằng transcript; tiến bộ chỉ so điều kiện tương thích | DONE (honest unavailable priorities; live scores deferred) |

Không đánh dấu KAI-027 DONE chỉ vì đã vẽ được đường cao độ. DONE cần xác nhận bằng tập dữ liệu và ngưỡng đã ghi ở KAI-023; KAI-034 kiểm tra lại trên tập giữ lại trước release B.

## 6. Tích hợp, vận hành và phát hành

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-030 · M · Backend/Frontend | Lịch sử và tiến độ Kaiwa; ADR streak/XP/mục tiêu riêng | KAI-020; KAI-024 cho metric nói tự động | Có lịch sử take ngay ở A; active speaking/XP chỉ bật sau chất lượng dữ liệu đủ; retry không đếm lại; test qua nửa đêm theo múi giờ; không sửa nghĩa số thẻ/ngữ pháp đã học | DONE (030a); 030b TODO |
| KAI-031 · L · Operations/Backend | Media backup/restore, quota cleanup, xóa đồng bộ job/assets, logging/metrics và config | KAI-006, KAI-007, KAI-022 | Restore DB + media chạy được; xóa lúc job đang chạy không hồi sinh tệp; log không chứa audio/token; có cảnh báo disk/queue; retention được ghi trong hướng dẫn | DONE |
| KAI-032 · L · QA/Security | Security/accessibility/responsive QA; auth, ownership, file abuse, keyboard, lỗi mạng | KAI-011, KAI-016, KAI-022, KAI-031 | Test hai tài khoản, path traversal, MIME giả, quota/rate-limit, HTML phụ đề; focus/keyboard/ruby/mobile đúng; chạy regression module cũ phù hợp | DONE |
| KAI-033 · L · QA/PM | Gate A: thiết bị thực, full flow, crash recovery, sync và export; tài liệu sử dụng | KAI-012, KAI-017–022, KAI-030–032 | Checklist A có evidence trên từng môi trường công bố hỗ trợ; không lỗi chặn; manual import hoạt động không cần API; trạng thái scoring chưa có được nói rõ; release/rollback notes đầy đủ | DONE |
| KAI-034 · L · Japanese/QA/PM | Gate B: đánh giá độc lập, cost/load/provider outage, UX học và bàn giao | KAI-015, KAI-023–029, KAI-033 | Báo cáo held-out đạt ngưỡng đã chốt, gồm false feedback và coverage; giáo viên duyệt; không lỗi nghiêm trọng chưa xử lý; giới hạn được ghi; scoring thật trên video user, không chỉ fixture | TODO |

KAI-030 có hai checklist: lịch sử ở A; thời gian nói/XP dựa trên phân tích ở B. Gate A chỉ yêu cầu checklist lịch sử đạt, không bắt metric giả để mở khóa phát hành. Tracker chi tiết phải tách chúng thành KAI-030a/KAI-030b khi bắt đầu task.

## 7. Studio theo đoạn + overlay (ADR-019) — ưu tiên Gate A speakable

Phát sinh từ feedback thiết bị 18/09/2026: thu liên tục không hiện script đúng đoạn → người học không nói được. Tham chiếu UX: Dub Stage (overlay + clip N/M + replay original / record / replay take / next).

**Không** thay Gate C đóng vai. **Không** xóa chế độ liên tục (KAI-017–022 vẫn giữ).

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-036 · M · UX/PM | Đặc tả studio theo đoạn + wireflow; cập nhật UX-SPEC / USAGE / CHECKLIST | ADR-019, KAI-004 | Có spec overlay, controls clip, skip/subset, progress N/M, copy VI; continuous vẫn có overlay; không bắt chọn vai | DONE |
| KAI-037 · M · Backend | Schema/API: `capture_mode`, segment clip assets, tiến độ N/M, ownership | KAI-005, KAI-036 | Migration additive; clip thuộc attempt+segment; conflict/version; test cross-account | DONE |
| KAI-038 · L · Frontend/Media | UI phòng thu theo đoạn: overlay JA/furigana/VI, clip controls, mic | KAI-036, KAI-017, KAI-016 | Nhìn script trên video khi thu; nghe mẫu đoạn / thu / nghe mình / trước-sau; ≥44px; mobile không tràn ruby | DONE |
| KAI-039 · L · Media/Backend | Ghép clip đoạn → learner track timeline + gắn review/export | KAI-037, KAI-020, KAI-022 | Silence/giữ gốc ở gap; duration khớp video; metadata `assembly=segment`; không ghi nhãn continuous giả; test gap/overlap | DONE |
| KAI-040 · S · Frontend | Chọn mode studio (mặc định theo đoạn; liên tục = nâng cao) | KAI-038 | Default segment; nhớ preference tài khoản; copy giải thích khác biệt mode | DONE |
| KAI-041 · M · Frontend | Overlay live cho mode liên tục (câu hiện tại + kế) theo video clock | KAI-018, KAI-036 | Khi recording continuous vẫn đọc được lời; không dừng theo câu; không chỉ list dưới video | DONE |
| KAI-042 · M · Frontend/Backend | Thu đè lại một đoạn không xóa clip khác; lịch sử take theo segment | KAI-037, KAI-038 | Re-record segment tạo clip mới; clip cũ giữ hoặc version; attempt aggregate cập nhật | DONE |
| KAI-043 · M · Frontend | Progress N/M, skip, luyện tập con (subset) cho script dài | KAI-038 | 90+ đoạn không bắt thu hết một lần; skip có lý do; resume đúng clip | DONE |
| KAI-044 · M · Frontend | Review/attempt UI: trạng thái từng đoạn + seek A/B theo clip | KAI-021, KAI-039 | Biết đoạn nào đã thu/thiếu; nghe đúng cửa sổ; export vẫn độc lập scoring | DONE |
| KAI-045 · S · QA | Cập nhật checklist/preflight Gate A cho mode segment (+ continuous overlay) | KAI-038–041, KAI-033 | CHECKLIST có hàng segment PASS bắt buộc; continuous optional advanced | DONE |
| KAI-046 · M · QA | Device matrix: Chrome/Edge thu theo đoạn full flow | KAI-045 | Evidence checklist; không lỗi chặn nói được | DONE |
| KAI-047 · S · Docs | USAGE-GATE-A + release notes phản ánh dual-mode và honesty capture_mode | KAI-036, KAI-045 | Tài liệu khớp sản phẩm; không hứa chấm điểm giả | DONE |
| KAI-048 · S · Frontend | Segment record: countdown 3-2-1 + mute video sample during take | KAI-038 | Countdown hiển thị trước thu; video muted khi recording; Nghe mẫu vẫn có tiếng | DONE |
| KAI-049 · S · Frontend/Docs | Continuous countdown overlay parity + checklist/USAGE note mute | KAI-048 | Continuous 3-2-1 trên video; CHECKLIST §5b; USAGE khớp | DONE |

Thứ tự gợi ý: **KAI-036 → 037 → 038 → 039 → 040** (đường găng speakable); **041** song song sau 036; **042–044** hoàn thiện; **045–047** trước khi ký Gate A.

## 8. Đợt sau


| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-035 · L · PM/Media/Speech | Lập đặc tả đóng vai một nhân vật: speaker annotation, giữ lời vai còn lại, overlap và giới hạn tách nguồn | Gate B | Kế hoạch riêng dùng lại asset/revision/attempt; thử khả năng giữ lời người khác trước khi hứa sản phẩm; không cài đặt như điều kiện ngầm của bản đầu | TODO |

## 9. Auto phụ đề — script sync v1 rồi ASR v2 (ADR-020)

Phát sinh từ yêu cầu 18/09/2026: phụ đề tay đã OK; muốn (v1) video + lời **không timeline** → tự gắn thời gian theo tiếng trong video; (v2) chỉ video → tự tạo phụ đề. Spec: [`evidence/kai-050/AUTO-SUBTITLE-SPEC.md`](./evidence/kai-050/AUTO-SUBTITLE-SPEC.md).

**Không** thay Gate A device (KAI-046). **Không** bỏ đường SRT/VTT/soạn tay. Kết quả máy = **draft** phải duyệt (ADR-012/014).

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-050 · M · PM/Architect | ADR-020 + AUTO-SUBTITLE-SPEC + cập nhật PLAN/TASKS/USAGE pointer | User request | Spec có wireflow v1/v2, API, honesty, spike candidates, DoD | DONE |
| KAI-051 · M · Backend/Frontend | Ingest script không timeline: paste + `.txt`; normalize → candidate lines | KAI-013, KAI-050 | UTF-8; strip markup; tách dòng/câu ổn định; test ownership | DONE |
| KAI-052 · L · Speech/Media | Spike forced-align / Whisper-timestamps+match trên fixture JA ngắn | KAI-050, ffmpeg | Báo cáo engine chọn; đo lệch thời gian; ghi credential/local; không khóa vendor nếu fail | DONE (Engine A; median Δstart ~448 ms / Δend ~404 ms on TTS `tiny` — `evidence/kai-052/`) |
| KAI-053 · L · Backend | Job `align_script`: extract audio → align → ghi draft revision + metadata source | KAI-007, KAI-051, KAI-052 | Idempotent; không đè draft mới hơn; uncertain flags; 409 conflict | DONE |
| KAI-054 · M · Frontend | UI “Đồng bộ lời thoại với video”: opt-in, progress, mở editor với draft | KAI-053, KAI-013 | User sửa được trước publish; copy VI theo spec | DONE |
| KAI-055 · S · QA/Docs | Honesty + privacy + USAGE v1; capability `scriptAlign` | KAI-054, KAI-015 | Manual fallback khi not_configured; không auto-publish | DONE |
| KAI-056 · L · Speech/Backend | Live ASR adapter cho `POST …/transcriptions` (v2) | KAI-015, KAI-052 | Draft text+times; capability ready khi có key; 503 khi thiếu | DONE (local Whisper; mock for tests) |
| KAI-057 · M · Frontend | UI “Tự tạo phụ đề từ video” + banner rủi ro sai chữ | KAI-056 | Cùng editor review; không bỏ qua bước duyệt | DONE |
| KAI-058 · S · Docs | USAGE + release notes v1/v2 auto phụ đề | KAI-055, KAI-057 | Tài liệu khớp; không hứa OCR hardsub | DONE |

Thứ tự: **050 → 051 → 052 → 053 → 054 → 055** (= **v1.0**); rồi **056 → 057 → 058** (= **v2.0**). Spike 052 có thể BLOCKED nếu thiếu ffmpeg/credential — ghi rõ, vẫn giữ manual path.

## 9b. Chất lượng auto phụ đề + overlay trợ giúp (feedback 18/09/2026)

Phát sinh từ device: (1) nút đồng bộ «không chọn được» sau Áp dụng lời; (2) Furigana/Việt bật nhưng studio không hiện; (3) align lệch mốc; (4) ASR v2 gần như không nhận lời anime.

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-059 · S · Frontend | Sync dùng script từ paste **hoặc** segments hiện có; ghi rõ lý do disable; checkbox dễ bấm | KAI-054 | Sau «Áp dụng lời» vẫn đồng bộ được; hint VI khi thiếu paste/video | DONE |
| KAI-060 · M · Frontend | Overlay studio/prep: furigana từ tokens + VI; hint khi bật nhưng thiếu dữ liệu | KAI-038, KAI-041 | Toggle bật → thấy ruby nếu có tokens; VI hiện nếu có `vi`; placeholder trung thực nếu thiếu | DONE |
| KAI-061 · M · Speech | Cải thiện script-align: model mặc định tốt hơn, match/padding, báo uncertain rõ | KAI-053 | Đo lại trên fixture; USAGE nói giới hạn anime/BGM | DONE |
| KAI-062 · M · Speech | Cải thiện ASR v2: model/VAD/segment; fail rõ khi 0 câu; không hứa anime sạch | KAI-056 | Empty ASR → 422 rõ; model mặc định nâng; USAGE honesty | DONE |
| KAI-063 · S · Speech | Script-align: kéo end vào khoảng lặng trước dòng kế (Whisper cắt sớm) | KAI-061 | Spike median \|Δend\| ↓ vs §3b; sidecar + spike cùng logic | DONE |
| KAI-064 · S · Ops/QA | Script `kaiwa:speech-env` xác nhận ffmpeg + faster-whisper → capability ready | KAI-055, KAI-058 | Lệnh in ready/not_configured; runbook nhắc restart terminal | DONE |

## 9c. Forced-align v1 redesign (ADR-021) — ưu tiên trước v2

Spec: [`evidence/kai-065/FORCE-ALIGN-V1-SPEC.md`](./evidence/kai-065/FORCE-ALIGN-V1-SPEC.md).  
Tham chiếu UX: Subtitle Edit plain-text + Point Sync; engine bake-off: Qwen3-FA → stable-ts → WhisperX JA CTC (MFA dự phòng).  
**Không** commit audio cá nhân. **Không** đẩy v2 ASR lên trước khi đợt 1–3 có bằng chứng.

| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-065 · M · Speech/Backend | **Đợt 1 — chặn kết quả sai:** bỏ end-stretch; bỏ null→mốc giả; `timingStatus`; giữ id/vi/tokens khi sync timing; regression unit (Kanji/kana + gap 30s); fail khi 0 câu proposed | ADR-021 | Không còn cửa sổ nuốt gap dài do stretch; unmatched không giả timed; metadata giữ; test PASS | DONE |
| KAI-066 · L · QA/Speech | **Đợt 2 — benchmark đúng:** harness dùng **cùng** adapter production; GT nghe+waveform; ≥ fixture pháp lý tối thiểu + schema 30-clip plan; ghi baseline greedy | KAI-065 | REPORT baseline; không dùng độ dài file TTS làm GT tuyệt đối | TODO |
| KAI-067 · L · Speech | **Đợt 3a — spike Qwen3-ForcedAligner-0.6B** trên fixture JA (CPU); đo latency/RAM/chất lượng | KAI-066 | Evidence số thật; không claim anime | TODO |
| KAI-068 · L · Speech | **Đợt 3b — spike stable-ts align** cùng fixture | KAI-066 | So sánh bảng chung với 067 | TODO |
| KAI-069 · M · Speech | **Đợt 3c — spike WhisperX JA CTC** (đối chứng) + ghi giới hạn vocab/overlap | KAI-066 | REPORT + quyết định engine thắng (ADR amend nếu cần) | TODO |
| KAI-070 · L · Backend | **Đợt 4 — tích hợp engine thắng:** worker, progress, cancel, timeout, cache, idempotency; candidate proposal trước apply | KAI-067–069 | Request không khóa; restart không mất job; draft-only | TODO |
| KAI-071 · M · Backend | Cửa sổ video dài + overlap; dừng áp dụng cửa sổ fail; optional anchor đầu/cuối vùng | KAI-070 | Không chia đều theo số chữ; lỗi một cửa sổ không lan im lặng | TODO |
| KAI-072 · M · Frontend | Editor: nghe + context; filter unmatched/needs_review; banner trạng thái từng câu | KAI-065 | UI trung thực; studio không dùng unmatched làm cửa sổ thu mặc định | TODO |
| KAI-073 · L · Frontend | Waveform kéo start/end; khóa mốc; căn lại selection / giữa hai khóa; preview+undo | KAI-070, KAI-072 | 25/30 đúng giữ nguyên khi chỉ sửa 5 câu | TODO |
| KAI-074 · M · Speech | Tách speech timing vs practice padding/overlay early-show (config + docs) | KAI-065, KAI-072 | Transcript end ≠ kéo tới câu kế | TODO |
| KAI-075 · M · Ops | Capability `ready` cần smoke inference model (không chỉ import); tài liệu máy CPU | KAI-070 | speech-env/capability khớp | TODO |
| KAI-076 · L · QA | **Đợt 6 — held-out / anime user** (ngoài git): đo phút sửa / phút video; không trộn BGM nặng vào average | KAI-070–073 | Evidence; v2 vẫn sau | TODO |

Thứ tự cứng: **065 → 066 → (067∥068∥069) → 070 → 071/072/074 → 073 → 075 → 076**. V2 ASR không chen trước 066 trừ khi user override.

## 10. Checklist task đang làm

```text
Task: KAI-065 DONE. Next READY: KAI-066 benchmark harness.
Gate A: ACCEPTED (KAI-046). V2 ASR: tạm dừng ưu tiên.
```

## 11. Nhật ký tiến trình

| Ngày | Thay đổi | Kiểm chứng | Việc tiếp theo |
| --- | --- | --- | --- |
| 18/09/2026 | Gate A ACCEPTED + ADR-021; KAI-065 Phase 1 honesty | `test_align_regression.py` OK; `npm test` **121/121** | KAI-066 benchmark |
| 18/09/2026 | Gate A ACCEPTED (KAI-046 user ủy quyền); ADR-021 + TASKS §9c | CHECKLIST §5 | KAI-065 đợt 1 |
| 18/09/2026 | KAI-064 `npm run kaiwa:speech-env` (ffmpeg+Whisper ready check) | exit 0 trên máy này; runbook cập nhật | KAI-046 device |
| 18/09/2026 | KAI-063 end-stretch align (Whisper cắt sớm) | spike median Δend **568 ms** (was 952); REPORT §3c | KAI-046 / user re-test anime |
| 18/09/2026 | KAI-061 re-measure spike với Whisper `base` | median Δstart **28 ms** (TTS); REPORT §3b | KAI-046 / user re-test anime |
| 18/09/2026 | KAI-059–062 sync UX, furigana/vi hints, Whisper `base`, ASR empty 422 | `npm test` **120/120** | KAI-046 device / thử lại sync trên anime |
| 18/09/2026 | KAI-046 runbook refresh + preflight re-verify (agent parked) | `kaiwa:gate-a-preflight` OK | Human Chrome/Edge §2 |
| 18/09/2026 | KAI-056–058 ASR v2 API + UI + USAGE | `npm test`; build | KAI-046 device |
| 18/09/2026 | KAI-055 USAGE/release honesty script-align v1 | `npm test`; USAGE + RELEASE-NOTES | KAI-056 v2 hoặc KAI-046 |
| 18/09/2026 | KAI-054 UI đồng bộ script + banner draft máy + uncertain chip | `npm test` **117/117**; build OK | KAI-055 honesty/USAGE |
| 18/09/2026 | KAI-053 align_script job + draft source_json + capability | `npm test` **117/117**; build OK | KAI-054 UI |
| 18/09/2026 | KAI-052 spike DONE: ffmpeg + edge-tts fixture + faster-whisper timings | median Δstart 448 ms / Δend 404 ms; `results.json` | KAI-053 job |
| 18/09/2026 | KAI-052 spike probe → BLOCKED; provisional engine A (Whisper+match) | Env: no ffmpeg/keys/fixture; `evidence/kai-052/REPORT.md` | Unblock 052 or KAI-046 device |
| 18/09/2026 | KAI-051 untimed script ingest (paste/.txt + parseUntimedScript) | `npm test` **114/114**; build OK | KAI-052 spike |
| 18/09/2026 | ADR-020 + KAI-050 auto-subtitle spec/plan (v1 script-sync, v2 ASR) | Docs only | User duyệt → KAI-051 hoặc tiếp KAI-046 |
| 18/09/2026 | KAI-048 segment countdown 3-2-1 + mute video while recording | build OK; UI test | KAI-046 device |
| 18/09/2026 | Gate A preflight OK; CHECKLIST §0 filled; KAI-046 DEVICE-RUNBOOK | `npm test` **110/110**; preflight OK | Human Chrome/Edge §2 |
| 18/09/2026 | KAI-045 checklist/preflight + KAI-047 USAGE/release dual-mode | content checks OK; `npm test` | KAI-046 human device |
| 18/09/2026 | KAI-044 review per-segment status + seek A/B | `npm test` **110/110**; build OK | KAI-045 Gate A checklist |
| 18/09/2026 | KAI-043 subset filters + resume first pending | `npm test` **109/109**; build OK | KAI-044 review segment status |
| 18/09/2026 | KAI-042 re-record keeps peer clips + take history API | `npm test` **109/109**; build OK | KAI-043 subset/skip resume |
| 18/09/2026 | KAI-041 continuous live overlay (current+next) | `npm test` **108/108**; build OK | KAI-042 re-record |
| 18/09/2026 | KAI-040 persist capture-mode preference + VI mode copy | `npm test` **106/106**; build OK | KAI-041 continuous overlay |
| 18/09/2026 | KAI-039 assemble segment clips → timeline + finalize/export honesty | `npm test` **106/106**; build OK | KAI-040 mode preference |
| 18/09/2026 | KAI-038 segment studio UI (overlay + clip controls) | `npm test` **103/103**; build OK | KAI-039 assemble |
| 18/09/2026 | KAI-037 segment clips schema/API + captureMode default segment | `npm test` **102/102**; build OK | KAI-038 UI |
| 18/09/2026 | KAI-036 segment studio UX spec + USAGE/CHECKLIST/UX-SPEC | Docs: `evidence/kai-036/` | KAI-037 schema |
| 18/09/2026 | ADR-019 + backlog KAI-036–047: studio theo đoạn mặc định (feedback thiết bị) | Docs only — chưa code | KAI-036 spec |
| 18/09/2026 | KAI-029 feedback UI priorities + seek (no fake overall score) | `npm test` **100/100**; build OK; `docs/kaiwa/evidence/kai-029/REPORT.md` | KAI-033 device / KAI-023 |
| 18/09/2026 | KAI-028 assessment aggregate + idempotent cache (no overall score) | `npm test` **99/99**; build OK; `docs/kaiwa/evidence/kai-028/REPORT.md` | KAI-029 / KAI-033 device |
| 18/09/2026 | KAI-027 provisional relative F0/timing (no pitch-accent labels) | `npm test` **95/95**; build OK; `docs/kaiwa/evidence/kai-027/REPORT.md` | KAI-028 / KAI-033 device |
| 18/09/2026 | KAI-026 pronunciation schema + not_configured stub (no fake scores) | `npm test` **89/89**; build OK; `docs/kaiwa/evidence/kai-026/REPORT.md` | KAI-033 device / KAI-023 |
| 18/09/2026 | KAI-025 utterance/timeline alignment (synthetic; no phoneme claims) | `npm test` **81/81**; build OK; `docs/kaiwa/evidence/kai-025/REPORT.md` | KAI-033 device / KAI-023 |
| 18/09/2026 | KAI-024 provisional audio quality gate (PCM + unavailable WebM) | `npm test` **76/76**; build OK; `docs/kaiwa/evidence/kai-024/REPORT.md` | KAI-033 device / KAI-023 |
| 18/09/2026 | KAI-015 capability not_configured stub (live ASR deferred) | `npm test` **72/72**; build OK; `docs/kaiwa/evidence/kai-015/REPORT.md` | KAI-033 device / Gate B prep |
| 18/09/2026 | KAI-033 checklist + USAGE + release notes + preflight script + scoring honesty UI | `npm run kaiwa:gate-a-preflight`; device rows still empty | Human device Gate A |
| 18/09/2026 | KAI-032 cross-account/security suite + a11y checklist | `npm test` **70/70**; build OK; `docs/kaiwa/evidence/kai-032/REPORT.md` | KAI-033 Gate A devices |
| 18/09/2026 | KAI-031 soft-delete+GC, media backup+manifest, redact/ops snapshot | `npm test` **68/68**; build OK; `docs/kaiwa/evidence/kai-031/REPORT.md` | KAI-032 security QA |
| 18/09/2026 | KAI-030a history + activity events + ADR-018 (no XP inject) | `npm test` **65/65**; build OK; `docs/kaiwa/evidence/kai-030a/REPORT.md` | KAI-031 backup/media |
| 18/09/2026 | KAI-022 export MP4 + private download + mix snapshot | `npm test` **64/64**; build OK; `docs/kaiwa/evidence/kai-022/REPORT.md` | KAI-030a history |
| 18/09/2026 | KAI-021 review dual-gain + take history + mix persist | `npm test` **63/63**; build OK; `docs/kaiwa/evidence/kai-021/REPORT.md` | KAI-022 export MP4 |
| 18/09/2026 | KAI-020 finalize decode/duration/mic-only + tailMissing | `npm test` **62/62**; `docs/kaiwa/evidence/kai-020/REPORT.md` | KAI-021 review UI |
| 18/09/2026 | KAI-019 journal + attempt chunk resume/assemble | `npm test` **59/59**; build OK; `docs/kaiwa/evidence/kai-019/REPORT.md` | KAI-020 remux finalize |
| 18/09/2026 | KAI-018 continuous recorder + finalize idempotent | `npm test` **56/56**; build OK; `docs/kaiwa/evidence/kai-018/REPORT.md` | KAI-019 journal upload |
| 18/09/2026 | KAI-017 mic preflight (local meter/test, no provider) | `npm test` **52/52**; build OK; `docs/kaiwa/evidence/kai-017/REPORT.md` | KAI-018 continuous recorder |
| 18/09/2026 | KAI-016 prep screen + immutable start-practice snapshot | `npm test` **50/50**; build OK; `docs/kaiwa/evidence/kai-016/REPORT.md` | KAI-017 mic preflight |
| 18/09/2026 | KAI-014 reading/romaji/VI layers + Hepburn exceptions | `npm test` **48/48**; build OK; `docs/kaiwa/evidence/kai-014/REPORT.md` | KAI-016 prep screen |
| 17/09/2026 | KAI-013 SRT/VTT parser + edit UI split/merge | `npm test` **42/42**; build OK; `docs/kaiwa/evidence/kai-013/REPORT.md` | KAI-014 reading layers |
| 17/09/2026 | KAI-012 synthetic fixtures + vertical-slice integration | `npm test` **38/38**; `docs/kaiwa/evidence/kai-012/REPORT.md` | KAI-013 SRT/VTT |
| 17/09/2026 | KAI-011 library/upload/project UI + prepare-media + Range video | `npm test` **34/34**; `npm run build` OK; `docs/kaiwa/evidence/kai-011/REPORT.md` | KAI-012 fixtures |
| 17/09/2026 | KAI-010 passthrough proxy + identity timeline; source immutable; probe gate | `npx tsx --test tests/kaiwa/*.test.ts` **17/17**; evidence `docs/kaiwa/evidence/kai-010/REPORT.md` | KAI-011 UI upload/library |
| 17/09/2026 | Tạo plan/backlog/rules; xác định lồng tiếng liên tục là ưu tiên; tách gate A/B/C | Đọc stack/middleware/backup hiện tại và tài liệu media/pronunciation; chưa chạy hoặc triển khai module | KAI-001 rồi KAI-002; khởi động nghiên cứu KAI-003 sớm |

## 12. Điều kiện bên ngoài cần quản lý

- Provider/credentials và ngân sách: chỉ chặn live test phụ thuộc dịch vụ, không chặn upload, transcript thủ công, thu và export.
- Người duyệt tiếng Nhật và dữ liệu có quyền sử dụng: cần cho benchmark và gate B. Nội dung chưa duyệt không được đổi nhãn thành verified.
- Thiết bị thực: cần cho từng môi trường công bố hỗ trợ thu. Browser automation không thay cho thử microphone và clock thật.
- Chính sách lưu trữ/xóa/backup: phải chốt trước gate A, không đợi phát hành mới xử lý.
- Nếu có blocker, ghi chính xác task bị chặn và tiếp tục task độc lập. Không đánh dấu toàn dự án BLOCKED khi vẫn còn việc trong phạm vi được làm.
