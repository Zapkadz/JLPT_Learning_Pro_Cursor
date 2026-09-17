# Kế hoạch triển khai Kotoba Kaiwa Studio

Ngày lập: 17/09/2026. Trạng thái: kế hoạch triển khai; chưa triển khai module Kaiwa.

Đọc cùng [danh sách task](./TASKS.md) và [quy tắc triển khai, cập nhật tiến trình](./IMPLEMENTATION-RULES.md). Tài liệu này là phạm vi triển khai mới nhất, thay các đề xuất thứ tự tính năng trong [bản nghiên cứu](../KAIWA-RESEARCH-AND-PLAN.md).

## 1. Quyết định sản phẩm

Xây dựng một phòng luyện nói bằng cách **lồng tiếng liên tục cho toàn bộ video người dùng tải lên**. Người học nghe và hiểu lời thoại, chuẩn bị cách đọc, thu giọng từ đầu đến cuối, xem lại video với giọng của mình, nhận phản hồi và luyện lại.

Thứ tự đã chốt theo yêu cầu người dùng:

1. Lồng tiếng toàn video, có furigana, dịch Việt, romaji và tiến tới chấm phát âm/ngữ điệu tiếng Nhật.
2. Sau khi luồng trên ổn định mới triển khai đóng vai một nhân vật.
3. Hội thoại tự do, multiplayer, nhân bản giọng và các hình thức game khác nằm ngoài đợt này.

“Toàn video” nghĩa là không tự động dừng giữa các câu, không bắt người dùng chọn nhân vật và không ghép các lần thu từng câu để giả lập một lần thu liên tục. Hệ thống có thể chia âm thanh thành đoạn **sau khi thu** để phân tích; thao tác này không làm gián đoạn trải nghiệm thu.

Tính năng rèn khả năng nghe, đọc thành tiếng, nhịp và diễn đạt theo mẫu. Không diễn giải điểm lồng tiếng thành chứng nhận năng lực hội thoại tự do hoặc trình độ JLPT.

## 2. Các mốc phát hành

| Mốc | Người dùng làm được gì | Điều kiện hoàn thành |
| --- | --- | --- |
| A — Lồng tiếng trọn video | Upload, chuẩn bị phụ đề, bật/tắt trợ giúp, thu liên tục, nghe lại, lưu nhiều lần thu, xuất MP4 | Qua kiểm thử đồng bộ, lưu dữ liệu, lỗi thiết bị, quyền truy cập và xuất video; chấm điểm chưa sẵn sàng phải được ghi rõ |
| B — Phản hồi học tập hoàn chỉnh | Có phản hồi phát âm, nhịp và ngữ điệu đủ tin cậy; biết đoạn nào cần sửa và nghe so sánh | Qua bộ đánh giá tiếng Nhật, có giáo viên kiểm tra; số liệu không đủ thì trả “chưa đánh giá được”; đây mới là mốc hoàn thành phạm vi hiện tại |
| C — Đóng vai một nhân vật | Chọn nhân vật, giữ lời các vai còn lại, thu phần của mình | Lập kế hoạch riêng sau B; cần giải quyết tách người nói, lời chồng lấn và âm thanh nền |

Mốc A là bước bàn giao có thể sử dụng thực tế, không được gọi là đã hoàn thành toàn bộ yêu cầu. Nếu nghiên cứu chấm ngữ điệu chưa đạt, tiếp tục hoàn thiện B; không thay bằng điểm minh họa.

## 3. Phạm vi bản đầu

### 3.1 Bắt buộc

- Thư viện video riêng tư theo tài khoản; tìm kiếm, trạng thái xử lý, tiếp tục dự án đang làm.
- Upload video từ máy, kiểm tra định dạng thực, dung lượng và thời lượng; có tiến trình, hủy và thử lại.
- Nhập SRT/VTT hoặc nhập lời thoại thủ công; sửa câu và mốc thời gian, tách/gộp đoạn.
- Furigana, dịch Việt, romaji là ba lớp hiển thị độc lập, có thể sửa nội dung tự động tạo.
- Phòng thu: xem trước, nghe mẫu, thử micro, đếm ngược, thu liên tục ở tốc độ 1×.
- Bản thu tách riêng âm thanh micro và video nguồn; ghi nhận các mốc đồng bộ.
- Nghe lại toàn video; đổi âm lượng giọng mình và tiếng gốc; nghe A/B tại đoạn cần sửa.
- Lưu nhiều lần thu; người dùng chọn bản muốn giữ hoặc xuất; không tự xóa bản cũ khi thu lại.
- Xuất MP4 có giọng người học theo cấu hình âm lượng đã chọn; mặc định không đốt phụ đề vào video.
- Tiến trình xử lý, lịch sử, xóa dữ liệu, báo lỗi dễ hiểu và khôi phục trong giới hạn đã kiểm chứng.
- Ở mốc B: kiểm tra chất lượng audio, phân tích lời nói/phát âm, nhịp, ngữ điệu, phản hồi tiếng Việt dựa trên bằng chứng.

### 3.2 Tự động hóa được triển khai nhưng có đường thay thế

- Nhận dạng lời thoại và dịch bằng provider khi đã cấu hình. Nếu chưa có provider, nhập/sửa phụ đề thủ công vẫn dùng được toàn bộ luồng lồng tiếng.
- Nội dung do máy tạo ở trạng thái bản nháp. Người dùng duyệt trước khi dùng làm chuẩn chấm; không tự gán nhãn “đã được giáo viên kiểm chứng”.
- Video chưa có lời thoại vẫn có thể thu và xuất; chưa có chuẩn đáng tin cậy thì không chấm chi tiết.

### 3.3 Hoãn rõ ràng

Đóng vai; tách sạch lời khỏi nhạc bằng AI; nhận diện nhân vật tự động; sửa/thu đè một vùng giữa bản thu; pause/resume liền mạch trong cùng take; dub ở tốc độ khác 1×; OCR phụ đề đóng cứng; nhập bằng URL; bảng xếp hạng công khai; chia sẻ cộng đồng; hội thoại AI tự do; clone giọng. Nghe chậm khi chuẩn bị có thể hỗ trợ, nhưng khi bắt đầu thu phải quay về 1×.

### 3.4 Giới hạn pilot đề xuất

- Khởi điểm: video tối đa 10 phút, 250 MB; container MP4/WebM. Kiểm tra codec bằng công cụ đọc media và chuyển mã khi cần, không chỉ xét đuôi tệp.
- Đây là giới hạn cấu hình để đo tài nguyên và độ ổn định, không phải giới hạn đã được kiểm chứng. KAI-002/KAI-011 phải xác nhận hoặc điều chỉnh trước phát hành.
- Desktop Chrome/Edge là nhóm thu ưu tiên đầu tiên. Mobile/tablet cần giao diện đầy đủ, nhưng chỉ tuyên bố hỗ trợ thu trên những tổ hợp thiết bị/trình duyệt đã kiểm tra thực tế. Khi chưa hỗ trợ, cho xem/học và giải thích trước khi xin micro.
- Hạn mức lưu trữ, số job đồng thời, thời gian giữ bản nháp và ngân sách API được chốt thành cấu hình ở KAI-001/KAI-006/KAI-023. Không để vô hạn hoặc ghi cứng rải rác.

## 4. Luồng sử dụng và màn hình

### 4.1 Luồng chính

Thư viện → tải video → xử lý media → chuẩn bị lời thoại và bản dịch → nghe thử → kiểm tra micro → đếm ngược → thu hết video → lưu bản thu → nghe lại → phân tích → sửa lỗi/luyện lại → xuất MP4.

Phân tích và xuất video là hai job độc lập. Provider chấm điểm bị lỗi không làm mất bản thu và không chặn xuất video.

### 4.2 Danh sách màn hình

| Route đề xuất | Nội dung và hành động chính |
| --- | --- |
| `/kaiwa` | Thư viện; tạo dự án; thẻ video có thời lượng, lần luyện gần nhất và trạng thái xử lý |
| `/kaiwa/new` | Upload; giới hạn; tiến trình; hủy/thử lại |
| `/kaiwa/projects/:id/edit` | Video, danh sách câu, editor thời gian, nhập SRT/VTT, sửa tiếng Nhật/cách đọc/dịch Việt |
| `/kaiwa/projects/:id` | Tổng quan video; lời thoại đã duyệt; trợ giúp; bắt đầu luyện |
| `/kaiwa/projects/:id/studio` | Phòng thu; video lớn; câu hiện tại/câu kế tiếp; trạng thái micro, lưu dữ liệu và thời gian |
| `/kaiwa/attempts/:id` | Xem lại; trộn âm lượng; lỗi theo thời điểm; bản thu trước; xuất video |
| `/kaiwa/history` | Lịch sử theo ngày/video; thời gian nói; lần luyện; tình trạng đánh giá |

Kế thừa navigation, typography, màu, form và xác thực của Kotoba. Không đưa UI phức tạp của phần mềm dựng phim vào màn hình luyện nói.

### 4.3 Quy tắc UX quan trọng

- Furigana mặc định bật, romaji mặc định tắt; dịch Việt bật/tắt độc lập. Nhớ lựa chọn theo tài khoản, không gắn cứng vào nội dung.
- Khi đang thu: khóa tua và đổi tốc độ; không tự cuộn làm che video; có chỉ báo đang thu và hành động kết thúc rõ ràng.
- Nếu người dùng dừng sớm, lưu thành bản thu chưa hoàn tất khi dữ liệu hợp lệ. Không báo “đã lồng tiếng xong toàn video”.
- Mất micro, video đứng, chuyển nền hoặc mất khả năng đồng bộ: kết thúc an toàn với lý do cụ thể. Không tiếp tục âm thầm rồi tạo bản thu lệch.
- Mất mạng: tiếp tục chỉ khi bộ đệm cục bộ còn an toàn; hiển thị chưa đồng bộ. Đầy bộ đệm phải dừng có kiểm soát.
- Bản thu đã nhận trên server, bản còn trên thiết bị và bản đã xử lý xong là ba trạng thái khác nhau.
- Dùng tai nghe được đề xuất ở bước thử micro. Không bật nghe trực tiếp giọng micro ra loa mặc định.
- Nhạc và lời nằm chung một track: giảm tiếng gốc sẽ giảm cả hai. Chỉ có điều khiển nhạc riêng khi thực sự có track nền riêng; không tạo nút “giữ nhạc, tắt lời” giả.
- Phần trợ giúp lỗi cần có văn bản; biểu đồ và màu sắc không phải cách duy nhất truyền đạt kết quả.

## 5. Kiến trúc phù hợp với repo hiện tại

Repo đang dùng React 19 + TypeScript + Vite, Express 5, SQLite, cookie session và Zod. Giữ stack này cho giai đoạn đầu; không đổi toàn bộ nền tảng để thêm một module.

| Thành phần | Trách nhiệm |
| --- | --- |
| `src/features/kaiwa/` | Trang, player, editor, recorder state machine, upload/resume client, feedback |
| `shared/kaiwa/` | Schema Zod, DTO, trạng thái, lỗi nghiệp vụ, hợp đồng kết quả chấm |
| `server/modules/kaiwa/` | Route, service, repository, ownership, quota, phiên upload và bản thu |
| `server/workers/kaiwa/` | Durable jobs: probe/transcode, ghép audio, xuất MP4, ASR, chấm điểm, dọn tệp |
| `server/modules/kaiwa/providers/` | Adapter ASR, dịch, pronunciation; capability map theo locale và version |
| Worker DSP tùy kết quả spike | Phân tích tín hiệu/nhịp/F0; tách process và giao tiếp bằng hợp đồng job, không bắt Python chạy trong HTTP request |
| Private media storage | Tệp nguồn, proxy, micro audio, output; local filesystem ban đầu, interface cho object storage sau |

HTTP tiếp nhận công việc và trả job ID. Chuyển mã/chấm điểm không chạy đồng bộ trong request. SQLite lưu metadata; không nhét video/audio lớn vào DB hoặc base64 JSON.

Express hiện có giới hạn JSON 2 MB. Thêm đường upload nhị phân riêng với quota phù hợp, tiếp tục áp dụng auth/origin checks. Không tăng giới hạn JSON toàn ứng dụng lên hàng trăm MB. Kiểm tra lại middleware rate-limit và thông báo lỗi 413 để upload/resume hợp lệ không bị chặn sai.

Worker có lease/heartbeat, retry có giới hạn, idempotency và trạng thái lỗi. Khi restart, nhận lại job hết lease; không tạo hai bản xuất hoặc tính tiền hai lần một cách vô thức. Với provider không hỗ trợ idempotency, cần lưu operation ID hoặc chuyển trạng thái chưa rõ để đối soát trước khi gửi lại.

## 6. Dữ liệu và versioning

Tên bảng dưới đây là đề xuất logic; chốt migration cụ thể ở KAI-005.

| Entity | Trường và ràng buộc chính |
| --- | --- |
| `kaiwa_projects` | id, owner_id, title, source_asset_id, active_revision_id, status, deleted_at |
| `kaiwa_assets` | owner_id, storage_key, kind, checksum, bytes, media metadata, processing status; key do server sinh |
| `kaiwa_revisions` | project_id, version, state draft/reviewed, source metadata, created_at; bản dùng cho take là bất biến |
| `kaiwa_segments` | revision_id, stable segment id, start_ms, end_ms, ja, vi, review_state, optional speaker_label, assessable/reason |
| `kaiwa_readings` | segment_id, token offsets, surface, reading, romaji, generation version, manual override |
| `kaiwa_uploads` | owner_id, purpose, expected size/hash, accepted chunks, expiry, state |
| `kaiwa_attempts` | owner_id, revision_id, audio_asset_id, record state, clocks/offset, duration, completion, device capability metadata |
| `kaiwa_capture_chunks` | attempt_id, sequence, checksum, byte count, storage reference; UNIQUE(attempt_id, sequence) |
| `kaiwa_assessments` | attempt_id, segment_id, rubric/provider/model version, status, nullable metrics, confidence, reasons, evidence timestamps |
| `kaiwa_exports` | attempt_id, mix configuration/version, asset_id, job_id, state |
| `kaiwa_jobs` | kind, payload version, idempotency key, state, retry count, lease, progress, error code |
| `kaiwa_activity_events` | owner_id, attempt_id, event key, valid speaking duration, occurred_at; khóa chống đếm trùng |

Sửa phụ đề sau khi thu phải tạo revision mới. Bản thu cũ và kết quả cũ vẫn tham chiếu đúng nội dung đã dùng. Thay provider/rubric không ghi đè mất lịch sử; kết quả mới có version riêng.

Một lần thu không phụ thuộc entity nhân vật. `speaker_label` có thể để trống, chỉ nhằm mô tả hoặc loại đoạn chồng giọng khỏi chấm; không tạo bước gán vai bắt buộc.

Asset đang được attempt/export tham chiếu không bị dọn như tệp tạm. Xóa dự án sử dụng tombstone, hủy job và dọn theo tham chiếu để worker đang chạy không tạo lại dữ liệu đã xóa.

## 7. Hợp đồng API đề xuất

Tất cả route dưới `/api/kaiwa`, dùng session hiện tại và kiểm tra owner ở từng tài nguyên.

| Nhóm | Endpoint dự kiến | Hành vi cần đảm bảo |
| --- | --- | --- |
| Dự án | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id` | Phân trang, validate, ownership, xóa theo lifecycle |
| Upload | `POST /uploads`, `PUT /uploads/:id/chunks/:index`, `GET /uploads/:id`, `POST /uploads/:id/complete`, `DELETE /uploads/:id` | Hạn mức, checksum, thứ tự, resume, hoàn tất một lần |
| Media | `GET /assets/:id/content` | Private stream, HTTP Range/HEAD, đúng MIME, chống truy cập chéo |
| Lời thoại | `GET/PUT /projects/:id/draft`, `POST /projects/:id/revisions` | Lưu nháp, optimistic concurrency, snapshot sau duyệt |
| Tự động hóa | `POST /projects/:id/transcriptions`, `POST /projects/:id/translations` | Job có version và source revision; không đè bản chỉnh tay mới hơn |
| Thu | `POST /projects/:id/attempts`, `PUT /attempts/:id/chunks/:index`, `GET /attempts/:id/upload-state`, `POST /attempts/:id/finalize` | Thuộc owner, timeline metadata, checksum, finalize idempotent |
| Kết quả | `GET/DELETE /attempts/:id`, `GET /projects/:id/attempts` | Trả trạng thái thật, bảo toàn take cũ |
| Phân tích | `POST /attempts/:id/assessments`, `GET /attempts/:id/assessments` | Chỉ phân tích audio hợp lệ; không chấm lại tự động mỗi lần mở trang |
| Xuất | `POST /attempts/:id/exports`, `GET /exports/:id` | Snapshot mix, job độc lập, download có quyền |
| Công việc/tiến độ | `GET /jobs/:id`, `GET /progress` | Poll có backoff; tổng hợp chống trùng; không tiết lộ job người khác |

Chunk cùng index và cùng checksum được nhận lại an toàn; cùng index khác nội dung trả conflict. Không tin duration/MIME/hash do client khai báo nếu chưa kiểm tra. Route hoàn tất không được chuyển sang ready khi thiếu chunk hoặc decode thất bại.

## 8. Đồng bộ video và giọng thu

### 8.1 Nguyên tắc

- Timeline chuẩn là thời gian trình chiếu của video proxy đã chuẩn hóa. Ghi lại mapping với audio mẫu, không dùng số chunk để suy ra thời gian.
- Chốt mốc bắt đầu sau khi video và recorder sẵn sàng; dùng clock đơn điệu và sample/media timestamps. Lưu offset, sample rate, codec và các sự kiện gián đoạn.
- Phân biệt độ trễ thiết bị với việc người học nói chậm. Chỉ bù latency hệ thống đã đo; không kéo tất cả từ về khớp mẫu để che lỗi nhịp của người học.
- Tách audio micro thô khỏi audio mix để tiếng gốc không được chấm như giọng người học.
- Kiểm tra video có variable frame rate, xoay dọc, metadata start time khác 0, silent intro, EOF và đổi thiết bị.

MediaRecorder có thể phát chunk muộn và kích thước không đều. Không coi `timeslice` là đồng hồ chính xác. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/dataavailable_event).

Các blob riêng lẻ của một recording không được đảm bảo phát được độc lập. Vì vậy “đã lưu chunk” không đồng nghĩa “chắc chắn khôi phục sau crash”; spike phải xác minh container/codec, ghép/remux và các tình huống ghi bị cắt. Nếu cần journal PCM qua AudioWorklet thì quyết định dựa trên kết quả và chi phí lưu trữ. [W3C MediaStream Recording](https://www.w3.org/TR/mediastream-recording/).

### 8.2 State machine

`idle → preparing → ready → countdown → recording → finalizing → saved`

Nhánh khác: `permission_denied`, `interrupted`, `upload_pending`, `recoverable`, `failed`, `discarded`. State thu, state upload và state xử lý media là các trục riêng; không ép tất cả vào một boolean `isRecording`.

Chỉ hiển thị “Đã lưu” khi server xác nhận tệp hoàn chỉnh, decode được và metadata khớp. IndexedDB dùng làm bộ đệm có hạn mức/TTL; không để audio trong localStorage hoặc sessionStorage. Không thể khôi phục phần chưa được trình duyệt giao hoặc chưa ghi bền vững; thông báo phải nói đúng giới hạn đó.

## 9. Lời thoại và các lớp hỗ trợ

- Transcript có câu, mốc đầu/cuối, trạng thái duyệt và thông tin nguồn. SRT/VTT phải xử lý BOM, CRLF, markup, timestamp lỗi và overlap; không render HTML tùy ý.
- Cho phép overlap hợp lệ ở nguồn nhưng đánh dấu không chấm tự động khi nhiều người nói cùng lúc; không ép dữ liệu thành câu đơn giả.
- Furigana dùng token/cách đọc theo ngữ cảnh; tên riêng, số đếm và cách đọc ngoại lệ cần sửa tay. Không chuyển từng Kanji rời sang âm đọc rồi ghép.
- Romaji sinh từ cách đọc đã duyệt, quy ước Hepburn được tài liệu hóa; có test cho trường âm, っ, ん, trợ từ は/へ/を. Không sửa dữ liệu Nhật gốc để đạt romaji đẹp.
- Dịch Việt theo ngữ cảnh; khi sửa câu Nhật, đánh dấu bản dịch/cách đọc liên quan cần xem lại. Không tự ghi đè nội dung chỉnh tay.
- Không tái sử dụng giới hạn 141 nhóm/4.230 câu của module Ngữ pháp cho Kaiwa. Nội dung Kaiwa tổ chức theo video và phiên bản lời thoại.

## 10. Thiết kế chấm điểm và phản hồi

### 10.1 Các lớp phân tích

| Lớp | Điều đánh giá | Quy tắc khi không đủ dữ liệu |
| --- | --- | --- |
| Chất lượng bản thu | Im lặng, clipping, nhiễu, tiếng mẫu lọt vào micro, khả năng căn chỉnh | Yêu cầu thu lại hoặc bỏ chấm đoạn; không cho 0 điểm phát âm vì lỗi micro |
| Mức hoàn thành lời thoại | Đọc đủ phần nào, bỏ/chen từ ở đoạn có thể đối chiếu | Phân biệt người học bỏ câu với dữ liệu bị mất; ghi coverage |
| Phát âm | Các tín hiệu phát âm mà engine tiếng Nhật thực sự hỗ trợ | Không suy ra độ chính xác phát âm từ ASR confidence hoặc chỉ so chuỗi chữ |
| Nhịp | Thời lượng, khoảng nghỉ, trường âm/âm ngắt khi có bằng chứng đủ tốt | Không ép time-warp quá mức che mất lỗi; từ chối kết luận nếu alignment kém |
| Ngữ điệu | Đường cao độ tương đối và chuyển động lên/xuống ở vùng hữu thanh | Không chấm âm sắc hay cao độ tuyệt đối; vùng vô thanh/nhiễu/chồng giọng để trống |

Azure là một ứng viên cho pronunciation, không phải lựa chọn đã được chốt. Tài liệu hiện tại ghi prosody assessment chỉ hỗ trợ `en-US`; không dùng nó như điểm ngữ điệu tiếng Nhật. Phần tiếng Nhật cần spike riêng và adapter chỉ công bố khả năng đã xác minh. [Tài liệu Microsoft](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment).

Pitch accent của từ và intonation của cả câu là hai đối tượng khác nhau. Bản đầu ưu tiên nhịp và ngữ điệu tương đối so với mẫu; chỉ thêm nhận xét lỗi pitch accent cụ thể khi có chuẩn và bộ đánh giá phù hợp. Giọng diễn xuất/cảm xúc trong video không tự động là chuẩn phát âm duy nhất.

### 10.2 Cách trình bày

- Mỗi đoạn trả trạng thái, các metric nullable, confidence, lý do bỏ chấm, thời điểm bằng chứng, phiên bản engine/rubric.
- Hiển thị số câu/thời lượng có thể đánh giá trên tổng số. Không cộng vùng không thể chấm vào một điểm tổng gây hiểu lầm.
- Trước khi rubric được hiệu chỉnh: hiển thị các chiều riêng và phản hồi định tính có bằng chứng. Chưa chốt công thức điểm tổng 100 hay trọng số tùy tiện.
- Mỗi lần thu ưu tiên 1–3 gợi ý quan trọng: vấn đề ở đâu → nghe mẫu → nghe mình → hành động luyện lại.
- Nếu dùng LLM để diễn giải tiếng Việt, đầu vào là bằng chứng có cấu trúc; không cho model đoán lỗi âm thanh chỉ từ transcript. Kết quả qua schema, có đường fallback không dùng LLM.
- So tiến bộ chỉ khi cùng nội dung/rubric tương thích. Không xem điểm khác provider hoặc khác câu là một đường tăng giảm đáng tin cậy.

### 10.3 Bộ đánh giá trước phát hành B

Đề xuất pilot: 30 câu có đối lập trường âm/âm ngắt/nhịp/câu hỏi-trần thuật, tối thiểu 150 bản thu được phép sử dụng, nhiều người Việt học tiếng Nhật và giọng mẫu tự nhiên; tách người nói giữa tập chỉnh ngưỡng và tập đánh giá cuối. Đây là kiểm chứng ban đầu, không đủ để quảng cáo chính xác cho mọi người dùng.

Hai người có chuyên môn tiếng Nhật đánh giá độc lập, giải quyết bất đồng, chốt rubric trước khi nhìn kết quả trên tập giữ lại. Đo tỷ lệ phản hồi đúng, báo lỗi oan, độ đồng thuận, coverage, latency và chi phí. Cần có bản thu đúng, sai có chủ đích, nhiễu, im lặng và giọng diễn cảm.

Ngưỡng đề xuất để thử nghiệm: ít nhất 90% nhận xét lỗi cụ thể được người đánh giá xác nhận đúng; tỷ lệ gắn lỗi lên mẫu được đánh giá là chấp nhận được không quá 5%. Báo kèm cỡ mẫu và độ bất định; không đạt bằng cách loại bỏ phần lớn dữ liệu. Mục tiêu coverage cho tiếng sạch phải được chốt trước đánh giá. Có thể thay ngưỡng sau pilot bằng quyết định có lý do, không hạ lén để công bố đạt.

Phản hồi chưa đạt ngưỡng phải bị ẩn hoặc được giới hạn đúng phạm vi; biểu đồ F0 thử nghiệm không đủ để đánh dấu task chấm ngữ điệu hoàn thành.

## 11. Tiến độ học, dữ liệu riêng tư và vận hành

### 11.1 Tiến độ

Theo dõi số phiên đã thu, thời gian thực sự nói, số đoạn đã luyện và nội dung cần luyện lại. Upload, xem video, chờ xử lý, khoảng lặng hoặc tải lại trang không sinh XP. Một attempt/event chỉ ghi công một lần; retry job không tăng streak.

Không đổi đơn vị mục tiêu “số thẻ” hiện tại thành phút nói. Thêm mục tiêu Kaiwa riêng; quy tắc đóng góp vào streak chung và XP cần ADR ở KAI-030, kiểm thử ngày theo `Asia/Ho_Chi_Minh`, thời gian lưu UTC. Không tự chuyển điểm Kaiwa thành rating FSRS.

### 11.2 Riêng tư và bảo mật

Media mặc định riêng tư; mọi thao tác đọc/tải/xóa/chấm có ownership. Micro chỉ bật sau hành động rõ ràng, dừng track khi rời trang. Trước khi gửi audio sang provider ngoài hệ thống, UI cần thông tin rõ về dịch vụ và chính sách lưu dữ liệu; không tự động gửi tất cả video mới upload đi chấm.

Kiểm tra file bằng nội dung, tên file do server sinh, giới hạn số lượng/dung lượng/thời lượng, CPU/RAM/time cho FFmpeg, không nội suy shell từ filename. Không lưu audio/transcript hoặc credential vào log thông thường. Dọn tệp tạm, buffer trình duyệt và output mồ côi theo chính sách đã chốt.

### 11.3 Vận hành

Backup hiện tại của repo chỉ sao lưu SQLite. Phải mở rộng quy trình cho media và manifest tham chiếu, có bài thử restore cả DB lẫn tệp trước phát hành A. Kiểm tra quyền riêng tư trong backup, thời gian lưu và phạm vi xóa khỏi các thế hệ backup.

Dashboard kỹ thuật cần biết: upload thành công/thất bại, job queue chờ, thời gian chuyển mã/xuất, tỷ lệ lỗi thu, drift đo được, chi phí provider và quota còn lại. Không cần thu nội dung lời nói để đo các chỉ số này.

## 12. Nghiệm thu tổng thể

Các con số sau là mục tiêu ban đầu cần KAI-002/KAI-004 xác nhận, không phải kết quả đã đạt.

| Nhóm | Điều kiện cần kiểm tra |
| --- | --- |
| Luồng chính | Upload → chuẩn bị → thu hết → xem lại → xuất MP4 chạy bằng dữ liệu thật; sau reload còn đúng bản thu |
| Đồng bộ | Fixture có mốc chuẩn ở đầu/giữa/cuối; sau bù độ trễ thiết bị, mục tiêu sai lệch ≤100 ms tại các mốc trên video 10 phút ở môi trường hỗ trợ |
| Khôi phục | Tắt tab/mất mạng/restart server ở các mốc; phục hồi được phần đã xác nhận hoặc báo chính xác phần mất; không hiển thị saved giả |
| Xuất | File giải mã được, thời lượng đúng, giọng không bị cắt cuối, gain đúng; video dọc/VFR và nguồn thiếu audio được xử lý rõ |
| Nội dung | Furigana/romaji/dịch sửa được, thay revision không làm sai lịch sử; subtitle lỗi không phá trang |
| Assessment | Qua benchmark giữ lại; thông báo đúng khi chưa đủ dữ liệu; không chấm tiếng gốc lọt micro thành thành tích |
| Tiến độ | Không đếm trùng, không tính upload/khoảng lặng thành thời gian nói, không làm thay đổi thống kê Flashcard/Ngữ pháp |
| Quyền riêng tư | Hai tài khoản không đọc/sửa/xóa media nhau; job đã xóa không làm dữ liệu xuất hiện lại |
| Accessibility | Keyboard đầy đủ, focus đúng, trạng thái đọc được, caption, các lớp chữ Nhật không gây tràn trên mobile |
| Vận hành | Restore DB + media thành công; restart worker không mất job; quota và budget chặn đúng |

## 13. Thứ tự thực hiện

1. Chốt hợp đồng và kiểm chứng rủi ro: KAI-001–004.
2. Nền tảng dữ liệu/media: KAI-005–012; hoàn thành vertical slice upload → playback sớm.
3. Chuẩn bị nội dung: KAI-013–016; provider tự động không chặn đường nhập tay.
4. Phòng thu, bản thu và xuất video: KAI-017–022.
5. Nhánh chấm điểm: KAI-023–029 dựa vào kết quả nghiên cứu, bắt đầu benchmark sớm để tránh dồn cuối.
6. Tiến độ, vận hành, kiểm thử và bàn giao: KAI-030–034.
7. Chỉ sau B mới lập chi tiết vai nhân vật: KAI-035.

Đường găng mốc A: quyết định capture → lưu trữ/job → upload/proxy → recorder/journal → finalize/review → export → restore/security/device QA. Đường găng mốc B: rubric và dữ liệu → ground truth → alignment/quality → pronunciation/prosody → hiệu chỉnh → đánh giá giữ lại.

Ước lượng lịch chỉ nên chốt sau spike capture và thử engine. Tách công sức phát triển, kiểm thử thiết bị, thời gian biên soạn/duyệt tiếng Nhật và thời gian chờ quyền truy cập dịch vụ; không gộp chúng thành một lời hứa “làm xong trong vài ngày”.

Task đầu tiên khi bắt đầu code là KAI-001, tiếp theo KAI-002. Trong lượt lập kế hoạch này chỉ tạo tài liệu, chưa sửa logic ứng dụng.
