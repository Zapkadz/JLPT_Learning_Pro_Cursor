# Kaiwa — backlog và tiến trình triển khai

Nguồn phạm vi: [PLAN.md](./PLAN.md). Quy tắc cập nhật: [IMPLEMENTATION-RULES.md](./IMPLEMENTATION-RULES.md).

Ngày cập nhật: 18/09/2026. Mốc A: **chờ studio theo đoạn (KAI-036+) rồi device**. Mốc B: chưa bắt đầu.

KAI-001–016, KAI-016–022, KAI-024–029, KAI-030a, KAI-031–032 DONE; KAI-015 stub DONE. KAI-033 packaging DONE / device PENDING. **ADR-019:** Gate A speakable = KAI-036–047 (segment studio) trước khi ACCEPTED.

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
| KAI-033 · L · QA/PM | Gate A: thiết bị thực, full flow, crash recovery, sync và export; tài liệu sử dụng | KAI-012, KAI-017–022, KAI-030–032 | Checklist A có evidence trên từng môi trường công bố hỗ trợ; không lỗi chặn; manual import hoạt động không cần API; trạng thái scoring chưa có được nói rõ; release/rollback notes đầy đủ | IN_PROGRESS |
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
| KAI-041 · M · Frontend | Overlay live cho mode liên tục (câu hiện tại + kế) theo video clock | KAI-018, KAI-036 | Khi recording continuous vẫn đọc được lời; không dừng theo câu; không chỉ list dưới video | TODO |
| KAI-042 · M · Frontend/Backend | Thu đè lại một đoạn không xóa clip khác; lịch sử take theo segment | KAI-037, KAI-038 | Re-record segment tạo clip mới; clip cũ giữ hoặc version; attempt aggregate cập nhật | TODO |
| KAI-043 · M · Frontend | Progress N/M, skip, luyện tập con (subset) cho script dài | KAI-038 | 90+ đoạn không bắt thu hết một lần; skip có lý do; resume đúng clip | TODO |
| KAI-044 · M · Frontend | Review/attempt UI: trạng thái từng đoạn + seek A/B theo clip | KAI-021, KAI-039 | Biết đoạn nào đã thu/thiếu; nghe đúng cửa sổ; export vẫn độc lập scoring | TODO |
| KAI-045 · S · QA | Cập nhật checklist/preflight Gate A cho mode segment (+ continuous overlay) | KAI-038–041, KAI-033 | CHECKLIST có hàng segment PASS bắt buộc; continuous optional advanced | TODO |
| KAI-046 · M · QA | Device matrix: Chrome/Edge thu theo đoạn full flow | KAI-045 | Evidence checklist; không lỗi chặn nói được | TODO |
| KAI-047 · S · Docs | USAGE-GATE-A + release notes phản ánh dual-mode và honesty capture_mode | KAI-036, KAI-045 | Tài liệu khớp sản phẩm; không hứa chấm điểm giả | TODO |

Thứ tự gợi ý: **KAI-036 → 037 → 038 → 039 → 040** (đường găng speakable); **041** song song sau 036; **042–044** hoàn thiện; **045–047** trước khi ký Gate A.

## 8. Đợt sau


| ID / cỡ / vai trò | Task và đầu ra | Phụ thuộc | Tiêu chí nghiệm thu | Trạng thái |
| --- | --- | --- | --- | --- |
| KAI-035 · L · PM/Media/Speech | Lập đặc tả đóng vai một nhân vật: speaker annotation, giữ lời vai còn lại, overlap và giới hạn tách nguồn | Gate B | Kế hoạch riêng dùng lại asset/revision/attempt; thử khả năng giữ lời người khác trước khi hứa sản phẩm; không cài đặt như điều kiện ngầm của bản đầu | TODO |

## 9. Checklist task đang làm

```text
Task: KAI-041 — Continuous mode live overlay (current + next line by video clock)
Trạng thái: READY → next
Phụ thuộc: KAI-018, KAI-036 DONE; KAI-040 DONE
```

## 10. Nhật ký tiến trình

| Ngày | Thay đổi | Kiểm chứng | Việc tiếp theo |
| --- | --- | --- | --- |
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

## 11. Điều kiện bên ngoài cần quản lý

- Provider/credentials và ngân sách: chỉ chặn live test phụ thuộc dịch vụ, không chặn upload, transcript thủ công, thu và export.
- Người duyệt tiếng Nhật và dữ liệu có quyền sử dụng: cần cho benchmark và gate B. Nội dung chưa duyệt không được đổi nhãn thành verified.
- Thiết bị thực: cần cho từng môi trường công bố hỗ trợ thu. Browser automation không thay cho thử microphone và clock thật.
- Chính sách lưu trữ/xóa/backup: phải chốt trước gate A, không đợi phát hành mới xử lý.
- Nếu có blocker, ghi chính xác task bị chặn và tiếp tục task độc lập. Không đánh dấu toàn dự án BLOCKED khi vẫn còn việc trong phạm vi được làm.
