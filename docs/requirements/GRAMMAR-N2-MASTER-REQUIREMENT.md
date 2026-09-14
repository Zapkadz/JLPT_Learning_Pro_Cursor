# KOTOBA — MASTER REQUIREMENT
# HOÀN THIỆN MODULE NGỮ PHÁP JLPT N2

Version: 1.0
Status: Approved Product Requirement
Scope: Grammar N2
Project: Kotoba

---

# 0. MỤC ĐÍCH CỦA TÀI LIỆU

Tài liệu này là yêu cầu phát triển chính thức cho module **Ngữ pháp JLPT N2** của website Kotoba.

Mục tiêu không chỉ là:

- dựng giao diện;
- nhập nội dung;
- hoặc tạo đủ số record.

Mục tiêu cuối cùng là xây dựng một module học Ngữ pháp N2 hoàn chỉnh, trong đó người học có thể:

1. xem toàn bộ khóa học;
2. chọn bài;
3. học từng mẫu ngữ pháp;
4. đọc lý thuyết;
5. xem ví dụ;
6. bật/tắt furigana;
7. luyện tập;
8. xem đáp án và giải thích;
9. theo dõi tiến độ;
10. đưa nội dung vào hệ thống ôn tập/SRS;
11. tiếp tục học mà không mất dữ liệu;
12. sử dụng tốt trên desktop, tablet và mobile.

Mọi thay đổi phải tiếp tục sử dụng kiến trúc hiện tại của Kotoba.

Không xây lại module từ đầu nếu implementation hiện tại có thể tiếp tục mở rộng.

Repository hiện tại là **source of truth về implementation**.

Tài liệu này là **source of truth về requirement**.

---

# 1. BA NGUỒN THAM CHIẾU VÀ VAI TRÒ CỦA TỪNG NGUỒN

Có ba nguồn tham chiếu chính.

Chúng có vai trò hoàn toàn khác nhau.

Không được trộn vai trò của chúng.

---

## 1.1. SHINKANZEN MASTER N2

Vai trò:

**CANONICAL COURSE STRUCTURE**

File tham chiếu:

`Ngữ pháp Shinkanzen N2.pdf`

Shinkanzen quyết định:

- số bài;
- thứ tự bài;
- grammar group thuộc bài nào;
- thứ tự grammar group;
- cách gom các pattern thành một canonical group;
- cấu trúc khóa học Kotoba.

Cấu trúc đã chốt:

- 26 lessons;
- 141 canonical grammar groups.

Không sử dụng số bài hoặc số mục trên website khác để tự thay đổi con số này.

Nếu một nguồn khác chia một nhóm thành nhiều bài:

Kotoba vẫn giữ canonical grouping theo Shinkanzen.

---

# 2. NHATKANJI

Vai trò:

**FUNCTIONAL / UX REFERENCE**

NhatKanji chỉ được dùng để tham khảo:

- workflow học;
- cách tổ chức lesson;
- cách hiển thị grammar group;
- grammar detail;
- exercise flow;
- furigana toggle;
- progress;
- navigation;
- practice tabs;
- translation practice;
- sentence ordering;
- interaction người học.

Mục tiêu là:

học hỏi FUNCTION tốt

chứ không clone website.

Không sao chép:

- source code;
- proprietary assets;
- logo;
- branding;
- dữ liệu;
- nội dung;
- giao diện pixel-for-pixel.

Kotoba phải giữ:

- design language hiện tại;
- component system hiện tại;
- navigation hiện tại;
- màu sắc và visual identity hiện tại.

NhatKanji trả lời câu hỏi:

> Chức năng nên hoạt động như thế nào?

Không phải:

> Giao diện phải giống hệt như thế nào?

---

# 3. TIẾNG NHẬT ĐƠN GIẢN

Nguồn:

`Tổng hợp Ngữ pháp N2 — Tiếng Nhật Đơn Giản`

Vai trò:

**PRIMARY CONTENT SOURCE**

Dùng để lấy và biên tập:

- ý nghĩa;
- formation;
- cách dùng;
- sắc thái;
- context;
- limitation;
- lưu ý;
- điểm dễ nhầm;
- ví dụ;
- thông tin hỗ trợ phân biệt grammar.

Chủ sở hữu nội dung đã cho phép sử dụng nội dung này trong Kotoba.

Phải giữ source metadata để có thể đối chiếu.

Tuy nhiên:

website nguồn KHÔNG quyết định canonical grammar grouping của Kotoba.

Một canonical grammar group có thể map tới:

- một bài nguồn;
- nhiều bài nguồn;
- hoặc chỉ một phần của bài nguồn.

Một bài nguồn cũng có thể cung cấp nội dung cho nhiều canonical grammar groups.

---

# 4. THỨ TỰ ƯU TIÊN KHI CÁC NGUỒN KHÁC NHAU

Dùng hierarchy sau:

COURSE STRUCTURE
→ Shinkanzen Master N2

FUNCTION / UX
→ NhatKanji reference

CONTENT
→ Tiếng Nhật Đơn Giản

IMPLEMENTATION
→ Kotoba current architecture

Nếu có conflict:

không tự trộn hoặc tự chọn tùy ý.

Phải xác định conflict thuộc loại nào.

Ví dụ:

NhatKanji chia hai pattern thành hai màn hình riêng
nhưng Shinkanzen coi chúng là một canonical group

→ Kotoba giữ một canonical group.

Tiếng Nhật Đơn Giản có hai bài riêng
nhưng Shinkanzen gộp chúng thành một group

→ map hai source article vào cùng canonical group.

---

# 5. PHẠM VI TOÀN KHÓA

Khóa học gồm:

26 lessons.

Tổng:

141 canonical grammar groups.

Mỗi canonical grammar group có:

30 bài luyện.

Bao gồm:

10 Việt → Nhật
10 Nhật → Việt
10 Sắp xếp câu

Tổng toàn khóa:

141 × 30 = 4.230 exercises.

Đây là TARGET.

Không được coi target là số hoàn thành.

---

# 6. HIỆN TRẠNG ĐÃ CÓ

Lesson 1 hiện đã có:

- 5 grammar groups;
- nội dung từ nhiều source article;
- khoảng 103 cặp ví dụ Nhật–Việt sau khi lọc trùng;
- 150 bài luyện;
- grammar detail;
- practice;
- progress;
- review/SRS integration.

Một số nội dung vẫn có thể:

- thiếu furigana;
- cần language review;
- chưa có independent teacher review.

Không xây lại Lesson 1 nếu feature hiện tại hoạt động đúng.

Lesson 1 phải được hoàn thiện thành:

**GOLDEN TEMPLATE**

sau đó dùng cùng kiến trúc để scale Lesson 2–26.

---

# 7. VẤN ĐỀ 141 VS 151 PHẢI ĐƯỢC AUDIT

Requirement chính thức hiện tại là:

141 canonical grammar groups.

Trong UI hiện có trường hợp hiển thị:

151 mẫu.

Không được sửa:

151 → 141

bằng hard-code.

Agent phải điều tra root cause.

Cần xác định 151 là:

- canonical groups;
- variants;
- duplicated records;
- source entries;
- old data;
- hay một cách đếm khác.

Phải kiểm tra:

data
→ mapping
→ IDs
→ UI aggregation

rồi mới sửa.

Nếu canonical requirement được xác nhận vẫn là 141:

course progress phải dựa trên 141 canonical groups.

Grammar variant không được tự động tính thành một grammar group riêng.

---

# 8. USER JOURNEY CHÍNH

Luồng chính:

Grammar N2
→ Course Overview
→ Lesson
→ Grammar Group
→ Grammar Detail
→ Practice
→ Result
→ Progress
→ Review / SRS

Không tạo flow khác nhau cho mỗi lesson.

Tất cả 26 lessons sử dụng cùng một system.

---

# 9. COURSE OVERVIEW

Trang tổng Ngữ pháp N2 cần hiển thị:

- JLPT level;
- tên course;
- số lesson;
- tổng progress;
- lesson list;
- trạng thái lesson.

Mỗi lesson card cần hỗ trợ:

- lesson number;
- lesson title;
- Vietnamese topic/meaning ngắn;
- grammar group count;
- lesson progress;
- completion status;
- navigation.

Nếu lesson chưa hoàn thiện:

phải hiển thị đúng trạng thái.

Không tạo cảm giác toàn bộ content đã available nếu thực tế chưa có.

---

# 10. LESSON DETAIL

Khi vào một lesson:

hiển thị:

- lesson number;
- lesson title;
- short topic;
- danh sách grammar groups.

Mỗi grammar group card:

- canonical pattern;
- variants nếu cần;
- short Vietnamese meaning;
- learning status;
- practice access;
- navigation vào grammar detail.

Navigation có thể hỗ trợ:

Previous lesson
Current lesson
Next lesson

theo pattern UI phù hợp với Kotoba.

---

# 11. GRAMMAR DETAIL

Mỗi canonical grammar group có một grammar detail.

Trang này là nơi người học thực sự học grammar.

Cần có các phần sau.

---

## 11.1. Header

Hiển thị:

- canonical pattern;
- variants;
- short meaning;
- lesson;
- progress/status.

---

## 11.2. Formation

Hiển thị formation dạng trực quan.

Ví dụ:

N + pattern

Vる + pattern

Vた + pattern

Adj + pattern

Không trình bày toàn bộ formation thành paragraph khó đọc.

---

## 11.3. Meaning

Giải thích nghĩa bằng tiếng Việt.

Phải:

- rõ;
- ngắn gọn;
- đúng semantic meaning.

---

## 11.4. Usage

Giải thích:

- dùng khi nào;
- dùng trong context nào;
- formal/informal;
- spoken/written;
- nuance;
- register;
- limitation.

---

## 11.5. Notes

Bao gồm:

- common mistakes;
- restriction;
- nuance;
- trường hợp không dùng;
- điều dễ hiểu nhầm.

---

## 11.6. Comparison

Nếu grammar có pattern gần nghĩa:

cần giải thích:

- giống nhau ở đâu;
- khác nhau ở đâu;
- khi nào thay thế được;
- khi nào không thay thế được.

---

# 12. VÍ DỤ TRONG GRAMMAR DETAIL

Nguồn Tiếng Nhật Đơn Giản thường có nhiều example.

Không cần hiển thị tất cả example trong grammar detail.

Mục tiêu của phần example là:

- minh họa usage;
- thể hiện nuance;
- giúp learner hiểu;
- không gây quá tải.

Chọn một số example đại diện.

Không đặt một quota cứng nếu không cần thiết.

Thông thường:

chọn đủ example để cover các usage khác nhau.

Có thể khoảng:

3–8 example

nhưng đây chỉ là guideline.

Không được:

cắt content chỉ để đạt con số.

---

# 13. MỖI EXAMPLE CẦN CÓ

Mỗi learning example phải có tối thiểu:

- stable ID nếu architecture yêu cầu;
- Japanese sentence;
- Vietnamese translation;
- furigana/reading data;
- source;
- review status.

Japanese raw text phải sạch.

Không để presentation furigana dính trực tiếp vào Japanese sentence.

---

# 14. PHÂN BIỆT LEARNING EXAMPLE VÀ EXERCISE

Source example pool phải được chia thành hai mục đích.

SOURCE EXAMPLES

→ LEARNING EXAMPLES

và

→ PRACTICE CANDIDATES

Learning examples:

dùng trong grammar detail.

Practice candidates:

dùng để xây exercise.

Ưu tiên:

không dùng chính xác cùng một sentence cho cả:

learning example

và

practice.

Lý do:

learner vừa nhìn thấy answer sẽ làm giảm giá trị luyện tập.

Nếu cần reuse vì source hạn chế:

phải có lý do rõ.

---

# 15. CONTENT PIPELINE

Mỗi canonical grammar group phải đi qua pipeline:

1. Locate canonical group.
2. Xác định lesson.
3. Locate source article(s).
4. Mapping.
5. Extract relevant content.
6. Normalize data.
7. Collect examples.
8. Deduplicate.
9. Language review.
10. Chọn learning examples.
11. Chọn exercise candidates.
12. Author thêm exercises nếu cần.
13. Validate.
14. Integrate.
15. Test.
16. Update progress.

Không làm theo kiểu:

scrape
→ dump
→ complete.

---

# 16. SOURCE MAPPING

Phải có:

`SOURCE-MAPPING.md`

hoặc hệ thống tương đương.

Mapping phải cover đủ:

141 canonical grammar groups.

Mỗi record cần có:

- lesson ID;
- lesson number;
- lesson title;
- grammar group ID;
- canonical pattern;
- variants;
- PDF reference;
- source URL(s);
- match status;
- content status;
- review status;
- notes.

---

# 17. MATCH STATUS

Tối thiểu:

`full-match`

`partial-match`

`needs-review`

`not-found`

Không biến toàn bộ mapping thành:

true / false

vì quá ít thông tin.

---

# 18. CONTENT STATUS

Có thể sử dụng:

`not-imported`

`imported`

`editing`

`language-reviewed`

`independent-review-pending`

`verified`

Không gọi một group là verified nếu mới chỉ import data.

---

# 19. QUY TẮC MAPPING

Canonical grouping theo Shinkanzen.

Không dùng số article trên website để quyết định số group.

Một canonical group có thể:

→ nhiều source article.

Một source article có thể:

→ nhiều canonical group.

Không gộp grammar chỉ vì:

dịch tiếng Việt giống nhau.

Không tách grammar chỉ vì:

website nguồn viết thành hai bài.

---

# 20. CONTENT MODEL CHO GRAMMAR GROUP

Data model phải có khả năng biểu diễn:

## Identity

- ID;
- lessonId;
- canonicalName;
- variants.

## Meaning

- shortMeaning;
- detailedMeaning.

## Formation

- structures;
- word classes.

## Usage

- explanation;
- context;
- nuance;
- register;
- restrictions.

## Notes

- common mistakes;
- limitations.

## Comparison

- related patterns;
- differences.

## Examples

- Japanese;
- Vietnamese;
- readings;
- source.

## Metadata

- source;
- source reference;
- importedAt;
- review status;
- content version.

Không nhất thiết field name phải giống chính xác nếu schema hiện tại đã có model tốt hơn.

Không tự tạo schema mới nếu existing architecture đã giải quyết được.

---

# 21. FURIGANA

Furigana phải là structured data.

Không lưu raw Japanese dạng:

日本(にほん)

nếu architecture hỗ trợ reading riêng.

Phải có:

Japanese raw
+
reading/furigana metadata

UI chịu trách nhiệm render.

Furigana toggle phải hoạt động consistent.

Rà lại Lesson 1 để tìm các câu còn thiếu furigana.

---

# 22. LANGUAGE QA

Không mặc định source luôn chính xác.

Cần kiểm tra:

- Kanji;
- Kana;
- spelling;
- reading;
- Vietnamese translation;
- Japanese naturalness;
- tense;
- subject;
- nuance;
- grammar usage;
- formation;
- explanation;
- exercise answer.

Đặc biệt kiểm tra consistency:

formation
↔ usage
↔ examples
↔ exercises.

---

# 23. REVIEW LEVEL

Phải phân biệt:

## Data Validated

Schema và format đúng.

## Language Reviewed

Nội dung đã được AI/editor rà ngôn ngữ.

## Independent Review

Được giáo viên hoặc reviewer độc lập xác nhận.

Không ghi:

teacher approved

expert verified

nếu chưa có independent review thật.

---

# 24. EDIT LOG

Các sửa đổi có semantic impact nên được trace.

Có thể log:

- grammar ID;
- field;
- old content;
- new content;
- reason;
- source/reference;
- reviewer;
- version/time.

Không cần log những thay đổi pure formatting không ảnh hưởng meaning.

---

# 25. PRACTICE — TỔNG QUAN

Mỗi canonical grammar group:

30 exercises.

Phải đúng:

10 VI → JA

10 JA → VI

10 SENTENCE ORDERING

Không nhiều hơn hoặc ít hơn nếu chưa có decision mới.

---

# 26. 30 EXERCISES PHẢI THỰC CHẤT

Không được tạo quota giả.

Không làm:

Sentence A
→ đổi tên Tanaka thành Suzuki
→ gọi là Sentence B.

Không:

một sentence Việt→Nhật
→ đảo ngược lại
→ gọi là sentence Nhật→Việt mới.

Không:

cùng sentence
→ cắt thành ordering
→ tự động tính thành exercise thứ ba.

Ưu tiên:

30 distinct learning contexts.

---

# 27. KHI SOURCE CÓ NHIỀU VÍ DỤ

Nếu source có nhiều example:

chọn những câu tốt nhất.

Một phần:

→ learning examples.

Một phần:

→ exercise candidates.

Không cần dùng hết.

Chất lượng quan trọng hơn số lượng source được dùng.

---

# 28. KHI SOURCE KHÔNG ĐỦ 30 EXERCISES

Nếu source không có đủ 30 sentence phù hợp:

được phép author thêm.

Exercise tự biên soạn phải:

- đúng grammar;
- tự nhiên;
- phù hợp N2;
- không duplicate;
- không artificial;
- qua review.

Metadata nên thể hiện origin:

`source`

`source-adapted`

`authored`

Không generate placeholder rồi đánh dấu complete.

---

# 29. VIỆT → NHẬT

Mỗi grammar group:

10 exercises.

Workflow:

Vietnamese prompt
→ learner nhập Japanese
→ Hint
→ Check
→ Model answer
→ Explanation

Exercise cần có khả năng biểu diễn:

- id;
- grammarGroupId;
- promptVi;
- modelAnswerJa;
- accepted alternatives;
- hint;
- explanation;
- origin;
- source;
- review status.

Không coi:

answer khác model answer

là mặc định sai.

Japanese translation có thể có nhiều cách hợp lệ.

---

# 30. AI EVALUATION

Nếu hệ thống hiện tại hỗ trợ AI evaluation:

AI chỉ được dùng như:

assistive feedback.

Không coi AI score là authoritative truth.

Không tự động dùng AI score để quyết định SRS mastery nếu chưa có rule được duyệt.

Nếu AI unavailable:

practice vẫn phải usable theo model-answer comparison.

---

# 31. NHẬT → VIỆT

Mỗi grammar group:

10 exercises.

Workflow:

Japanese
→ learner dịch Vietnamese
→ Check/Compare
→ Model translation
→ Explanation

Model translation cần:

- natural Vietnamese;
- đúng semantic;
- đúng nuance.

Không dùng strict string equality để chấm.

---

# 32. SENTENCE ORDERING

Mỗi grammar group:

10 exercises.

Tham khảo functionality kiểu JLPT ordering.

Có:

- sentence context;
- blank slots;
- fragments;
- fragment IDs;
- learner selection;
- reorder;
- reset;
- check;
- explanation.

Nếu sử dụng ★:

phải có:

star position

và requirement rõ.

Không tạo ordering có nhiều answer đúng nhưng system chỉ chấp nhận một.

Không cắt fragment phi tự nhiên chỉ để làm puzzle khó hơn.

---

# 33. ORDERING DATA

Data cần có khả năng biểu diễn:

- id;
- grammarGroupId;
- prefix;
- suffix;
- fragments[];
- correctOrder[];
- starPosition;
- completedSentence;
- explanation;
- origin;
- source;
- reviewStatus.

Fragments phải dùng stable ID.

Không dùng fragment text làm identity duy nhất.

---

# 34. EXERCISE VALIDATION

Một grammar group chỉ được coi exercise-complete khi:

exactly:

10 VI→JA

10 JA→VI

10 ordering

và:

- unique IDs;
- required fields;
- no missing answers;
- explanations có;
- ordering data hợp lệ;
- grammar relation đúng;
- không duplicate giả;
- source/origin metadata hợp lệ.

Phải có script/test validate khi có thể.

Không chỉ kiểm tra bằng mắt.

---

# 35. HINT

Hint không reveal toàn bộ answer ngay.

Hint có thể đưa:

- keyword;
- grammar pattern;
- formation clue;
- context clue.

Không copy nguyên model answer vào hint.

---

# 36. VIEW ANSWER

Learner có thể xem answer.

Nhưng system phải phân biệt:

viewed answer

khác:

correct answer

khác:

mastered.

Không cộng XP tương đương correct nếu chỉ bấm xem đáp án.

Không tăng SRS mastery chỉ vì learner xem answer.

---

# 37. AUDIO

Nếu Kotoba đã có audio system:

có thể dùng cho Japanese examples.

Nếu chưa:

audio không phải blocker cho core Grammar N2.

Không tự xây lại TTS infrastructure nếu requirement hiện tại chưa cần.

Có thể ghi audio thành future enhancement.

---

# 38. LEARNING PROGRESS

Phải phân biệt tối thiểu:

opened

read

practiceStarted

exerciseAnswered

practiceCompleted

result

reviewAdded

reviewHistory

Không dùng một boolean `completed` cho tất cả.

---

# 39. COURSE PROGRESS

Course progress dựa trên:

canonical grammar groups.

Không đếm:

variant

source article

example

exercise

thành grammar group.

Nếu total canonical groups là 141:

progress denominator phải reflect 141.

---

# 40. PERSISTENCE

Phải đảm bảo:

refresh không làm mất progress.

Đổi tab không mất practice state nếu product đã thiết kế lưu.

Save failure không làm local data biến mất ngay.

Double submit không double XP.

Reload không double XP.

Content update không reset progress.

---

# 41. SRS

SRS phải tiếp tục logic hiện có.

Không tự thiết kế lại SRS.

Không suy diễn:

translation score

thành:

memory quality

nếu chưa có scoring rule rõ.

Không reset review history khi grammar content được chỉnh sửa.

---

# 42. XP / HEATMAP / STATS

Phải regression-test:

- XP;
- heatmap;
- streak nếu có;
- grammar count;
- learned count;
- review stats;
- progress.

Import content không được tạo fake learning event.

---

# 43. STABLE IDS

Canonical grammar group phải có stable ID.

Exercises phải có stable ID.

Nếu examples có reference từ progress/history:

examples cũng cần stable ID thích hợp.

Không dùng array index làm canonical ID.

Không thay ID khi chỉ edit nội dung.

---

# 44. CONTENT VERSIONING

Content đã phát hành không nên silent-mutated nếu thay đổi có thể ảnh hưởng:

- answer;
- history;
- attempts;
- progress;
- SRS;
- analytics.

Nếu architecture đã có versioning:

reuse.

Nếu chưa có:

không tự tạo ngay.

Phân tích impact và thêm vào PLAN trước.

---

# 45. KHÔNG RESET USER DATA

Không:

- delete progress;
- overwrite progress;
- reset SRS;
- reset learning history;
- remap IDs bừa;
- migrate destructive

chỉ để đơn giản hóa implementation.

Existing user data phải được bảo vệ.

---

# 46. ARCHITECTURE

Tiếp tục architecture hiện tại.

Trước khi tạo:

- component mới;
- service mới;
- schema mới;
- API mới;
- utility mới;

phải tìm xem project đã có solution tương đương chưa.

Ưu tiên reuse.

Không tạo parallel architecture.

---

# 47. DATA ORGANIZATION

Scale từ Lesson 1 → 26 lessons phải maintainable.

Không tạo một file monolithic quá lớn nếu architecture không phù hợp.

Có thể chia theo:

lesson

hoặc:

grammar group

tùy existing project conventions.

Yêu cầu:

- dễ maintain;
- dễ validate;
- dễ version;
- dễ load;
- ID stable.

---

# 48. FRONTEND PAYLOAD

Chỉ tải data cần thiết.

Không gửi toàn bộ khóa xuống client nếu không cần.

Đặc biệt:

không expose toàn bộ exercise answer bank nếu architecture có thể giữ boundary tốt hơn.

Không sửa security/data boundary mà chưa đánh giá.

---

# 49. IMPORT PIPELINE

Import cần có:

duplicate protection.

Nếu có thể:

idempotent behavior.

Phải phát hiện:

- duplicate grammar;
- duplicate example;
- duplicate exercise;
- malformed content;
- missing source;
- invalid IDs;
- missing required fields.

Partial failure không được để data store ở trạng thái không xác định.

---

# 50. GOLDEN TEMPLATE

Lesson 1 phải được hoàn thiện trước khi scale toàn khóa.

Audit Lesson 1 về:

- grammar grouping;
- source mapping;
- content;
- furigana;
- examples;
- exercises;
- 10/10/10 distribution;
- progress;
- SRS;
- responsive;
- APIs;
- tests.

Khi Lesson 1 pass:

nó trở thành Golden Template.

---

# 51. GOLDEN TEMPLATE PHẢI ĐỊNH NGHĨA

Golden Template phải xác định pattern chuẩn cho:

- data model;
- grammar detail;
- lesson detail;
- exercise tabs;
- translation practice;
- ordering;
- progress;
- SRS;
- API;
- validation;
- tests;
- source metadata.

Lesson 2–26 phải chủ yếu là:

content expansion

không phải:

25 lần viết lại feature.

---

# 52. IMPLEMENTATION PHASES

## Phase 0

Current State Audit.

## Phase 1

Inventory + Source Mapping đủ 141 groups.

## Phase 2

Hoàn thiện Lesson 1 Golden Template.

## Phase 3

Lesson 2–5.

## Phase 4

Lesson 6–10.

## Phase 5

Lesson 11–15.

## Phase 6

Lesson 16–20.

## Phase 7

Lesson 21–26.

## Phase 8

Full-course acceptance.

Không nhảy trực tiếp sang full-course completion.

---

# 53. QUY TRÌNH CỦA MỖI PHASE

Mỗi phase:

SOURCE MAPPING

→ CONTENT IMPORT

→ NORMALIZATION

→ CONTENT QA

→ EXERCISE AUTHORING

→ DATA VALIDATION

→ INTEGRATION

→ TESTING

→ DOCS UPDATE

→ GIT REVIEW

→ COMMIT

→ PUSH

→ NEXT PHASE/TASK

---

# 54. QUY TRÌNH CHO MỖI TASK

Mỗi task:

PLAN

→ IMPLEMENT

→ VERIFY

→ UPDATE PROGRESS

→ REVIEW DIFF

→ COMMIT

→ PUSH

→ SELECT NEXT TASK

Không đánh dấu complete trước khi verify.

---

# 55. PLAN.md

`PLAN.md` là task source of truth.

Dùng stable task IDs.

Ví dụ:

N2-AUDIT-001

N2-MAP-001

N2-L01-FURI-001

N2-L02-CONTENT-001

N2-L02-EXERCISE-001

N2-L02-QA-001

Task phải:

- nhỏ;
- cụ thể;
- bounded;
- verifiable.

Không tạo task kiểu:

`Hoàn thành toàn bộ N2`.

---

# 56. PROGRESS.md

Phải lưu actual state.

Ví dụ:

Lessons technically complete: 1 / 26

Canonical groups implemented: 5 / 141

Exercises validated: 150 / 4230

Không ghi:

4230 exercises complete

nếu chỉ là target.

---

# 57. MỖI PROGRESS ENTRY

Ghi:

- task ID;
- status;
- what changed;
- important files;
- validation;
- tests;
- result;
- commit;
- blocker.

Ngắn gọn nhưng đủ trace.

---

# 58. SOURCE-MAPPING.md

Đây là authoritative mapping record.

Mapping thay đổi phải ghi reason.

Không silent-remap grammar group.

---

# 59. IMPLEMENTATION-RULES.md

Nếu file đã có:

tuân thủ.

Chỉ cập nhật khi phát sinh reusable rule thực sự.

Không biến file này thành conversation dump.

---

# 60. CONTENT QA LOG

Các sửa chuyên môn quan trọng cần trace.

Đặc biệt:

- reading correction;
- translation correction;
- grammar correction;
- semantic correction;
- source discrepancy.

---

# 61. TEST STRATEGY

Sử dụng infrastructure hiện tại.

Có thể gồm:

- schema validation;
- content validation;
- unit tests;
- integration tests;
- API tests;
- Playwright;
- typecheck;
- build;
- lint.

Không nói:

tested

nếu chỉ đọc code.

---

# 62. DATA VALIDATION

Toàn khóa cần validation cho:

- lesson count;
- canonical group count;
- unique IDs;
- mapping completeness;
- required fields;
- exercise counts;
- exercise types;
- answers;
- explanations;
- ordering fragments;
- invalid references;
- duplicate exercises;
- content version references.

Không làm test pass bằng placeholder.

---

# 63. PLAYWRIGHT E2E

Khi Playwright MCP khả dụng:

test representative user journey.

Ví dụ:

Grammar N2

→ open lesson

→ open grammar

→ toggle furigana

→ read examples

→ start practice

→ VI→JA

→ JA→VI

→ ordering

→ submit

→ result

→ reload

→ progress preserved

→ add/review SRS.

Kiểm tra:

- console errors;
- network errors;
- broken buttons;
- navigation;
- state persistence.

Không cần browser-test cả 4.230 exercise.

Bulk content dùng automated validation.

---

# 64. RESPONSIVE

Phải kiểm tra:

desktop

tablet

mobile.

Đặc biệt:

- Japanese typography;
- long sentences;
- furigana;
- grammar cards;
- exercise input;
- ordering controls;
- result UI.

---

# 65. REGRESSION

Không làm hỏng:

- Vocabulary;
- Kanji;
- Flashcard;
- authentication;
- progress;
- SRS;
- XP;
- heatmap;
- user data.

Phase lớn cần regression verification.

---

# 66. GIT WORKFLOW

Trước commit:

`git status`

sau đó inspect:

`git diff`

Không commit:

- `.env`;
- credentials;
- temporary files;
- cache;
- debug files;
- unrelated changes.

Không discard pre-existing user changes.

---

# 67. COMMIT

Một commit:

một logical unit.

Ví dụ:

`feat(grammar-n2): add lesson 2 theory`

`feat(grammar-n2): add lesson 2 exercises`

`test(grammar-n2): validate lesson 2 practice bank`

`fix(grammar-n2): correct lesson 1 furigana`

Không dùng:

update

changes

fix stuff.

---

# 68. PUSH

Sau successful commit:

push current branch.

Nếu branch chưa có upstream:

set upstream theo normal git workflow.

Không force push.

Không bypass protection.

Nếu push fail:

ghi blocker.

Không tìm cách bypass security.

---

# 69. BLOCKERS

Dừng và hỏi user khi:

- canonical mapping ambiguous;
- semantic source conflict;
- cần product decision;
- architecture có nhiều hướng lớn;
- destructive migration;
- credentials;
- irreversible action.

Không hỏi user nếu có thể tự xác định chắc chắn bằng repository.

---

# 70. KHÔNG MỞ RỘNG SCOPE TÙY Ý

Nếu thấy issue ngoài task:

ghi lại.

Không tự refactor toàn project.

Chỉ xử lý ngay nếu:

- block task;
- security issue;
- data corruption;
- user yêu cầu.

---

# 71. DEFINITION OF DONE — GRAMMAR GROUP

Một grammar group chỉ complete khi:

- canonical mapping xác nhận;
- stable ID có;
- source mapping có;
- theory có;
- formation có;
- usage có;
- nuance/restriction phù hợp;
- examples có;
- translations có;
- furigana cần thiết có;
- source metadata có;
- review status đúng;

và:

10 VI→JA

10 JA→VI

10 ordering

tổng:

30 exercises

và:

- answers đầy đủ;
- explanations đầy đủ;
- validation pass;
- relevant UI works;
- relevant tests pass;
- progress works.

Independent teacher review có thể vẫn pending.

Nếu pending:

phải ghi rõ pending.

Không được giả lập verified.

---

# 72. DEFINITION OF DONE — LESSON

Lesson chỉ complete khi:

- mọi canonical group complete;
- group count đúng;
- UI lesson hoạt động;
- grammar detail hoạt động;
- practice hoạt động;
- progress hoạt động;
- validation pass;
- representative E2E pass;
- docs updated.

---

# 73. DEFINITION OF DONE — TOÀN KHÓA

Chỉ tuyên bố N2 hoàn thiện khi:

26 lessons thực tế có.

141 canonical groups thực tế có.

Canonical mapping đúng.

Mỗi group có content.

Mỗi group có representative examples.

Mỗi group có 30 validated exercises.

Tổng:

4230 validated exercises.

Mỗi group:

10 + 10 + 10.

Không thiếu:

- answer;
- explanation;
- required data;
- ordering data.

Không có:

- placeholder;
- fake duplicates;
- quảng cáo;
- executable scripts;
- furigana presentation lẫn trong raw Japanese.

Ngoài ra:

- progress hoạt động;
- reload không mất data;
- SRS hoạt động;
- user history an toàn;
- XP không double;
- regression pass;
- APIs pass;
- representative E2E pass;
- desktop usable;
- tablet usable;
- mobile usable;
- UI count khớp released data.

---

# 74. KHÔNG ĐƯỢC COI LÀ COMPLETE NẾU CHỈ

Import xong text.

Hoặc:

UI render được.

Hoặc:

database có đủ record.

Hoặc:

count đạt 4230 nhờ placeholder.

Hoặc:

Agent nói đã làm xong nhưng validation chưa chạy.

Completion phải có evidence.

---

# 75. BÁO CÁO SAU MỖI BATCH

Báo cáo gồm:

## Completed

Lesson/group nào complete.

## Content

Bao nhiêu groups.

Bao nhiêu learning examples.

## Exercises

VI→JA count.

JA→VI count.

Ordering count.

## QA

Review status.

## Validation

Script/test đã chạy.

## Tests

Command + result.

## Git

Branch.

Commit.

Push status.

## Remaining

Còn thiếu gì.

## Next

Task cụ thể tiếp theo.

Không dùng target làm completed count.

---

# 76. PRIORITY ORDER

Thứ tự ưu tiên:

1. Correctness
2. Data integrity
3. Learning quality
4. Existing user safety
5. Maintainability
6. Testability
7. Completeness
8. Development speed

Không đánh đổi correctness để làm nhanh.

---

# 77. FIRST ACTION — BẮT BUỘC AUDIT TRƯỚC

Sau khi đọc tài liệu này:

KHÔNG CODE NGAY.

KHÔNG sửa file.

KHÔNG commit.

KHÔNG push.

Thực hiện Current State Audit.

---

# 78. CURRENT STATE AUDIT

Đầu tiên:

1. Chạy `git status`.
2. Xác định branch.
3. Xác định uncommitted changes.
4. Đọc project rules.
5. Đọc README.
6. Đọc DESIGN.
7. Đọc PLAN.
8. Đọc PROGRESS.
9. Đọc SOURCE-MAPPING nếu có.
10. Đọc IMPLEMENTATION-RULES nếu có.
11. Đọc package.json.
12. Đọc grammar architecture.
13. Đọc Lesson 1.
14. Đọc exercise implementation.
15. Đọc progress.
16. Đọc SRS integration.
17. Đọc tests.
18. Đọc APIs.
19. Kiểm tra current data schema.

Không dựa vào conversation memory.

Repository là implementation source of truth.

---

# 79. AUDIT LESSON 1

Phải kiểm tra cụ thể:

Lesson 1 có đúng 5 canonical groups không.

150 exercises có thực sự là:

5 × 30

không.

Mỗi group có:

10 VI→JA

10 JA→VI

10 ordering

không.

Kiểm tra:

- missing exercise;
- duplicate;
- answer;
- explanation;
- furigana;
- source;
- IDs;
- progress.

---

# 80. AUDIT LEARNING EXAMPLES VS PRACTICE

Xác định:

learning examples đang được lưu ở đâu.

exercise bank đang được lưu ở đâu.

Bao nhiêu câu bị trùng giữa:

grammar detail examples

và:

practice.

Phân loại:

intentional

hoặc:

unnecessary duplication.

Không sửa trong audit.

Chỉ báo cáo.

---

# 81. AUDIT 141 VS 151

Phải xác định chính xác:

151 đến từ đâu.

Trace từ:

UI

→ selector/service

→ API

→ data

→ grammar mapping.

Không được chỉ search text `151` rồi sửa.

Phải tìm calculation/root cause.

---

# 82. AUDIT SCALE READINESS

Đánh giá current architecture có scale từ:

5 groups

→ 141 groups

và:

150 exercises

→ 4230 exercises

không.

Kiểm tra:

- bundle size;
- data loading;
- maintainability;
- answer exposure;
- validation;
- duplicate detection;
- content versioning;
- IDs.

---

# 83. AUDIT REPORT FORMAT

Sau khi audit, trả:

# CURRENT STATE AUDIT

## 1. Project Architecture

## 2. Grammar N2 Architecture

## 3. Current Lesson 1 State

## 4. Existing Functional Flow

## 5. NhatKanji-reference Functions Already Present

## 6. Missing Functional Requirements

## 7. Current Content Model

## 8. Current Example Model

## 9. Current Exercise Model

## 10. 150 Exercise Validation

## 11. Learning Example / Exercise Duplication

## 12. Progress / SRS Architecture

## 13. 141 vs 151 Root Cause Investigation

## 14. Source Mapping State

## 15. Test Coverage

## 16. Scale Risks

## 17. Data Integrity Risks

## 18. Things That Should Be Kept

## 19. Things That Need To Change

## 20. Proposed Golden Template

## 21. Proposed Implementation Plan

## 22. First Recommended Task

Kết thúc bằng:

`AUDIT COMPLETE — WAITING FOR IMPLEMENTATION APPROVAL`

Không code trong bước này.

---

# 84. SAU KHI USER DUYỆT PLAN

Sau khi user chấp thuận:

triển khai task-by-task.

Mỗi task:

Plan
→ Implement
→ Verify
→ Docs
→ Git diff
→ Commit
→ Push
→ Next task.

Không chạy hàng chục task rồi mới cập nhật progress.

---

# 85. AGENT BEHAVIOR

Agent phải:

- suy nghĩ trước khi code;
- đọc existing implementation;
- reuse pattern;
- tránh overengineering;
- tránh unrelated changes;
- verify trước khi complete;
- giữ repo sạch;
- duy trì PLAN/PROGRESS;
- không giả lập completion.

Tuân thủ `karpathy-guidelines`.

---

# 86. SOURCE OF TRUTH PRIORITY

Khi có khác biệt:

1. Current explicit user instruction
2. This Master Requirement
3. Canonical Shinkanzen mapping
4. DESIGN / product requirements
5. PLAN
6. Existing architecture
7. PROGRESS
8. Implementation judgment

Không dùng previous conversation memory để override repository hoặc requirement hiện tại.

---

# 87. NGUYÊN TẮC CUỐI

Mục tiêu cuối cùng không phải:

“có đủ dữ liệu”.

Mục tiêu là:

người học thực sự có thể học Ngữ pháp N2 trong Kotoba.

Module phải:

đúng

+

đầy đủ

+

dễ học

+

có bài luyện thực chất

+

lưu tiến độ đáng tin cậy

+

không phá dữ liệu cũ

+

có thể bảo trì lâu dài.

Không tuyên bố hoàn thành nếu chưa có bằng chứng kiểm chứng.