import { ruby } from "./_util.mjs";

export function lesson04Patterns(byId, makePattern) {
  const P = (id, theory, pack) => makePattern(byId(id), theory, pack, 4);

  return [
    P(
      "l04-g01",
      {
        meaning: "Lấy… làm đại diện / tiêu biểu; bắt đầu từ…",
        structures: ["N ＋ をはじめ（として）"],
        explanation:
          "Nêu một ví dụ tiêu biểu rồi hàm ý còn nhiều đối tượng cùng loại. Thường dùng liệt kê mở đầu.",
        usage: "Giới thiệu thành viên, sản phẩm, địa điểm tiêu biểu.",
        cautions: [
          "Sau をはじめ thường là nhóm đối tượng rộng hơn.",
          "Không dùng khi chỉ muốn nói 'bắt đầu làm việc gì' theo nghĩa khởi động hành động.",
        ],
        contrast:
          "をはじめとして ≈ lấy A làm tiêu biểu. Khác からして (xét từ / ngay cả) và を通じて (thông qua).",
        examples: [
          {
            ja: "東京をはじめ、大都市では家賃が高い。",
            reading: "とうきょうをはじめ、だいとしではやちんがたかい。",
            vi: "Lấy Tokyo làm tiêu biểu, ở các thành phố lớn tiền thuê nhà cao.",
            ruby: ruby([
              ["東京", "とうきょう"], ["をはじめ、"], ["大都市", "だいとし"],
              ["では"], ["家賃", "やちん"], ["が"], ["高", "たか"], ["い。"],
            ]),
          },
          {
            ja: "校長先生をはじめとして、教職員が出席した。",
            reading: "こうちょうせんせいをはじめとして、きょうしょくいんがしゅっせきした。",
            vi: "Lấy hiệu trưởng làm đầu, toàn bộ giáo viên đã tham dự.",
            ruby: ruby([
              ["校長", "こうちょう"], ["先生", "せんせい"], ["をはじめとして、"],
              ["教職員", "きょうしょくいん"], ["が"], ["出席", "しゅっせき"], ["した。"],
            ]),
          },
          {
            ja: "米をはじめとする農産物の価格が上がった。",
            reading: "こめをはじめとするのうさんぶつのかかくがあがった。",
            vi: "Giá nông sản lấy gạo làm tiêu biểu đã tăng.",
            ruby: ruby([
              ["米", "こめ"], ["をはじめとする"], ["農産物", "のうさんぶつ"],
              ["の"], ["価格", "かかく"], ["が"], ["上", "あ"], ["がった。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng をはじめ（として） để nêu ví dụ tiêu biểu rồi hàm ý còn nhiều đối tượng cùng loại.";
        const h = "N ＋ をはじめ（として）";
        return {
          viJa: [
            { p: "Lấy mẹ làm đầu, cả nhà đã đến.", a: "母をはじめ、家族全員が来た。", h, e },
            { p: "Lấy tiếng Anh làm tiêu biểu, ông ấy nói được nhiều ngôn ngữ.", a: "英語をはじめ、彼はいくつかの言語を話せる。", h, e },
            { p: "Lấy Osaka làm đầu, nhiều thành phố bị ảnh hưởng.", a: "大阪をはじめ、多くの都市が影響を受けた。", h, e },
            { p: "Lấy giám đốc làm đầu, nhân viên đã chào đón khách.", a: "社長をはじめとして、社員が客を迎えた。", h, e },
            { p: "Lấy táo làm tiêu biểu, trái cây năm nay ngon.", a: "りんごをはじめとする果物が今年はおいしい。", h, e },
            { p: "Lấy toán làm đầu, các môn thi đều khó.", a: "数学をはじめ、試験科目はどれも難しい。", h, e },
            { p: "Lấy đội trưởng làm đầu, cả đội đã tập luyện.", a: "キャプテンをはじめ、チーム全員が練習した。", h, e },
            { p: "Lấy xe buýt làm tiêu biểu, giao thông công cộng bị trì hoãn.", a: "バスをはじめ、公共交通が遅れた。", h, e },
            { p: "Lấy bác sĩ làm đầu, nhân viên y tế làm việc suốt đêm.", a: "医師をはじめとして、医療スタッフが夜通し働いた。", h, e },
            { p: "Lấy phong tục địa phương làm tiêu biểu, nhiều văn hóa đang được bảo tồn.", a: "地元の祭りをはじめとする文化が守られている。", h, e },
          ],
          jaVi: [
            { p: "日本をはじめ、アジア各国が参加した。", a: "Lấy Nhật Bản làm tiêu biểu, các nước châu Á đã tham gia.", h, e },
            { p: "彼をはじめとして皆が反対した。", a: "Lấy anh ấy làm đầu, mọi người đều phản đối.", h, e },
            { p: "パンをはじめとする小麦製品が値上がりした。", a: "Sản phẩm lúa mì lấy bánh mì làm tiêu biểu đã tăng giá.", h, e },
            { p: "市長をはじめ、関係者が集まった。", a: "Lấy thị trưởng làm đầu, các bên liên quan đã tụ họp.", h, e },
            { p: "音楽をはじめ、芸術全般に興味がある。", a: "Lấy âm nhạc làm tiêu biểu, tôi thích nghệ thuật nói chung.", h, e },
            { p: "子どもをはじめ家族の健康が一番だ。", a: "Lấy trẻ em làm đầu, sức khỏe gia đình là số một.", h, e },
            { p: "この店をはじめ、近所の店は早い時間に閉まる。", a: "Lấy quán này làm tiêu biểu, cửa hàng gần đây đóng sớm.", h, e },
            { p: "部長をはじめとして部署全員が残業した。", a: "Lấy trưởng phòng làm đầu, cả phòng tăng ca.", h, e },
            { p: "魚をはじめ海産物が豊富だ。", a: "Lấy cá làm tiêu biểu, hải sản phong phú.", h, e },
            { p: "留学生をはじめ、外国人が増えている。", a: "Lấy du học sinh làm tiêu biểu, người nước ngoài đang tăng.", h, e },
          ],
          order: [
            { p: "Lấy Tokyo làm tiêu biểu, nhà đất đắt.", t: ["東京を", "はじめ、", "大都市は", "家賃が高い。"], s: 1, h, e: e + " ★ là はじめ." },
            { p: "Lấy hiệu trưởng làm đầu, giáo viên có mặt.", t: ["校長を", "はじめとして", "教職員が", "出席した。"], s: 1, h, e: e + " ★ là はじめとして." },
            { p: "Lấy gạo làm tiêu biểu, nông sản tăng giá.", t: ["米を", "はじめとする", "農産物が", "値上がりした。"], s: 1, h, e: e + " ★ là はじめとする." },
            { p: "Lấy mẹ làm đầu, cả nhà đến.", t: ["母を", "はじめ、", "家族が", "集まった。"], s: 1, h, e: e + " ★ là はじめ." },
            { p: "Lấy tiếng Anh làm tiêu biểu, ông ấy giỏi ngoại ngữ.", t: ["英語を", "はじめ、", "多言語を", "話せる。"], s: 1, h, e: e + " ★ là はじめ." },
            { p: "Lấy giám đốc làm đầu, nhân viên chào khách.", t: ["社長を", "はじめとして", "社員が", "出迎えた。"], s: 1, h, e: e + " ★ là はじめとして." },
            { p: "Lấy toán làm đầu, các môn khó.", t: ["数学を", "はじめ、", "全科目が", "難しい。"], s: 1, h, e: e + " ★ là はじめ." },
            { p: "Lấy bác sĩ làm đầu, nhân viên trực đêm.", t: ["医師を", "はじめとして", "職員が", "夜勤した。"], s: 1, h, e: e + " ★ là はじめとして." },
            { p: "Lấy xe buýt làm tiêu biểu, giao thông chậm.", t: ["バスを", "はじめ、", "交通が", "乱れた。"], s: 1, h, e: e + " ★ là はじめ." },
            { p: "Lấy lễ hội địa phương làm tiêu biểu, văn hóa được giữ.", t: ["祭りを", "はじめとする", "文化が", "残っている。"], s: 1, h, e: e + " ★ là はじめとする." },
          ],
        };
      })(),
    ),

    P(
      "l04-g02",
      {
        meaning: "Ngay cả xét từ…; chỉ nhìn… cũng đủ thấy",
        structures: ["N ＋ からして"],
        explanation:
          "Lấy một chi tiết/điểm xuất phát để suy ra đánh giá tổng thể (thường tiêu cực hoặc nhấn mạnh).",
        usage: "Phê phán, nhận xét ấn tượng đầu: 'chỉ nhìn cách nói cũng…'.",
        cautions: [
          "Khác からすると／からすれば (từ góc nhìn của…) — bài này là からして.",
          "Thường nêu chi tiết tiêu biểu rồi kết luận.",
        ],
        contrast:
          "からして ≈ ngay cả xét từ A. Khác をはじめ (tiêu biểu liệt kê) và を通じて (phương tiện).",
        examples: [
          {
            ja: "第一印象からして感じが悪い。",
            reading: "だいいちいんしょうからしてかんじがわるい。",
            vi: "Ngay cả xét từ ấn tượng đầu tiên cũng khó chịu.",
            ruby: ruby([
              ["第一", "だいいち"], ["印象", "いんしょう"], ["からして"],
              ["感", "かん"], ["じが"], ["悪", "わる"], ["い。"],
            ]),
          },
          {
            ja: "話し方からして自信がありそうだ。",
            reading: "はなしかたからしてじしんがありそうだ。",
            vi: "Chỉ nhìn cách nói cũng thấy có vẻ tự tin.",
            ruby: ruby([["話", "はな"], ["し"], ["方", "かた"], ["からして"], ["自信", "じしん"], ["がありそうだ。"]]),
          },
          {
            ja: "この値段からして本物ではないだろう。",
            reading: "このねだんからしてほんものではないだろう。",
            vi: "Xét từ mức giá này thì chắc không phải hàng thật.",
            ruby: ruby([["この"], ["値段", "ねだん"], ["からして"], ["本物", "ほんもの"], ["ではないだろう。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng からして: xét từ một điểm để suy ra đánh giá tổng thể. Giữ đúng chi tiết xuất phát và kết luận.";
        const h = "N ＋ からして";
        return {
          viJa: [
            { p: "Chỉ nhìn thái độ cũng thấy không nghiêm túc.", a: "態度からして本気ではない。", h, e },
            { p: "Xét từ cách ăn mặc, ông ấy khá giả.", a: "服装からして裕福そうだ。", h, e },
            { p: "Ngay cả tên cửa hàng cũng kỳ lạ.", a: "店の名前からして変わっている。", h, e },
            { p: "Chỉ nhìn kết quả cũng biết đã cố gắng.", a: "結果からして努力したことがわかる。", h, e },
            { p: "Xét từ giọng nói, cô ấy đang giận.", a: "声の調子からして怒っているようだ。", h, e },
            { p: "Ngay cả cách chào cũng thiếu lịch sự.", a: "挨拶の仕方からして失礼だ。", h, e },
            { p: "Xét từ nguyên liệu, món này cao cấp.", a: "材料からして高級な料理だ。", h, e },
            { p: "Chỉ nhìn lịch trình cũng thấy bận.", a: "スケジュールからして忙しそうだ。", h, e },
            { p: "Xét từ phản ứng, anh ấy không biết chuyện.", a: "反応からして彼は事情を知らない。", h, e },
            { p: "Ngay cả thiết kế bao bì cũng kém.", a: "包装のデザインからして質が低い。", h, e },
          ],
          jaVi: [
            { p: "見た目からして怪しい。", a: "Chỉ nhìn bề ngoài cũng đáng ngờ.", h, e },
            { p: "言葉遣いからして教育を受けている。", a: "Xét từ cách dùng từ thì có học thức.", h, e },
            { p: "この味からして手作りではなさそうだ。", a: "Xét từ vị này thì có vẻ không làm thủ công.", h, e },
            { p: "歩き方からして急いでいるようだ。", a: "Chỉ nhìn cách đi cũng thấy đang vội.", h, e },
            { p: "部屋の様子からして昨夜は忙しかったらしい。", a: "Xét từ tình trạng phòng, đêm qua có vẻ bận.", h, e },
            { p: "彼の表情からして成功したようだ。", a: "Chỉ nhìn biểu cảm cũng thấy có vẻ thành công.", h, e },
            { p: "値段からして学生には高すぎる。", a: "Xét từ giá thì quá cao với sinh viên.", h, e },
            { p: "書き方からして急いで書いた文章だ。", a: "Xét từ cách viết thì bài viết vội.", h, e },
            { p: "この説明からして初心者向けだ。", a: "Xét từ phần giải thích thì dành cho người mới.", h, e },
            { p: "対応からしてクレームに慣れていない。", a: "Xét từ cách ứng xử thì chưa quen khiếu nại.", h, e },
          ],
          order: [
            { p: "Chỉ ấn tượng đầu cũng xấu.", t: ["第一印象", "からして", "感じが", "悪い。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Xét cách nói thì tự tin.", t: ["話し方", "からして", "自信が", "ありそうだ。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Xét giá thì không phải hàng thật.", t: ["この値段", "からして", "本物では", "ないだろう。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Chỉ thái độ cũng không nghiêm.", t: ["態度", "からして", "本気では", "ない。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Xét trang phục thì khá giả.", t: ["服装", "からして", "裕福そう", "だ。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Chỉ giọng nói cũng thấy giận.", t: ["声", "からして", "怒って", "いるようだ。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Xét nguyên liệu thì cao cấp.", t: ["材料", "からして", "高級な", "料理だ。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Chỉ lịch trình cũng thấy bận.", t: ["予定", "からして", "忙しそう", "だ。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Xét phản ứng thì không biết.", t: ["反応", "からして", "事情を", "知らない。"], s: 1, h, e: e + " ★ là からして." },
            { p: "Chỉ bề ngoài cũng đáng ngờ.", t: ["見た目", "からして", "怪しく", "見える。"], s: 1, h, e: e + " ★ là からして." },
          ],
        };
      })(),
    ),

    P(
      "l04-g03",
      {
        meaning: "Suốt / trải dài… (thời gian hoặc không gian)",
        structures: ["N ＋ にわたって／にわたり／にわたる"],
        explanation:
          "Nêu phạm vi rộng về thời gian hoặc không gian mà sự việc bao phủ.",
        usage: "Tin tức, báo cáo: cuộc họp kéo dài nhiều ngày; thiệt hại trên diện rộng.",
        cautions: [
          "Thường đi với khoảng thời gian / khu vực có quy mô.",
          "にわたる hay dùng như tính từ (数日にわたる会議).",
        ],
        contrast:
          "にわたって ≈ trải suốt phạm vi. Khác を通じて (thông qua/suốt kỳ) và 限り (phạm vi điều kiện).",
        examples: [
          {
            ja: "会議は三日間にわたって行われた。",
            reading: "かいぎはみっかかんにわたっておこなわれた。",
            vi: "Cuộc họp đã diễn ra suốt ba ngày.",
            ruby: ruby([
              ["会議", "かいぎ"], ["は"], ["三", "みっ"], ["日", "か"], ["間", "かん"],
              ["にわたって"], ["行", "おこな"], ["われた。"],
            ]),
          },
          {
            ja: "全国にわたる調査が実施された。",
            reading: "ぜんこくにわたるちょうさじっしされた。",
            vi: "Một cuộc điều tra trải khắp cả nước đã được thực hiện.",
            ruby: ruby([
              ["全国", "ぜんこく"], ["にわたる"], ["調査", "ちょうさ"],
              ["が"], ["実施", "じっし"], ["された。"],
            ]),
          },
          {
            ja: "長期間にわたり支援を続けた。",
            reading: "ちょうきかんにわたりしえんをつづけた。",
            vi: "Đã tiếp tục hỗ trợ trong một thời gian dài.",
            ruby: ruby([
              ["長期", "ちょうき"], ["間", "かん"], ["にわたり"],
              ["支援", "しえん"], ["を"], ["続", "つづ"], ["けた。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng にわたって／にわたり／にわたる để nói trải suốt phạm vi thời gian hoặc không gian.";
        const h = "N ＋ にわたって／にわたり／にわたる";
        return {
          viJa: [
            { p: "Triển lãm diễn ra suốt một tuần.", a: "展示会は一週間にわたって開かれた。", h, e },
            { p: "Mưa lớn ảnh hưởng trên diện rộng nhiều tỉnh.", a: "大雨は数県にわたって影響を与えた。", h, e },
            { p: "Họ tranh luận suốt hai giờ.", a: "彼らは二時間にわたって議論した。", h, e },
            { p: "Đây là dự án kéo dài nhiều năm.", a: "これは数年にわたるプロジェクトだ。", h, e },
            { p: "Hỗ trợ được duy trì trong thời gian dài.", a: "支援は長期間にわたり続いた。", h, e },
            { p: "Dịch bệnh lan rộng nhiều khu vực.", a: "感染症は広い地域にわたって広がった。", h, e },
            { p: "Buổi hòa nhạc kéo dài suốt đêm.", a: "コンサートは夜通しにわたって行われた。", h, e },
            { p: "Nghiên cứu bao phủ nhiều lĩnh vực.", a: "研究は多方面にわたっている。", h, e },
            { p: "Họ đàm phán suốt cả ngày.", a: "交渉は一日にわたって続いた。", h, e },
            { p: "Thiệt hại trải dài nhiều thành phố.", a: "被害は多くの都市にわたった。", h, e },
          ],
          jaVi: [
            { p: "試験は三日にわたって実施される。", a: "Kỳ thi sẽ được tổ chức suốt ba ngày.", h, e },
            { p: "数週間にわたる工事が終わった。", a: "Công trình kéo dài vài tuần đã kết thúc.", h, e },
            { p: "全国にわたって同じ現象が見られた。", a: "Hiện tượng giống nhau được thấy trên toàn quốc.", h, e },
            { p: "長年にわたり研究を続けてきた。", a: "Đã tiếp tục nghiên cứu suốt nhiều năm.", h, e },
            { p: "広い範囲にわたる停電が起きた。", a: "Đã xảy ra mất điện trên phạm vi rộng.", h, e },
            { p: "会議は午前から午後にわたって行われた。", a: "Cuộc họp diễn ra suốt từ sáng đến chiều.", h, e },
            { p: "数カ国にわたる協力が必要だ。", a: "Cần hợp tác trải nhiều quốc gia.", h, e },
            { p: "長時間にわたる運転は危険だ。", a: "Lái xe suốt thời gian dài thì nguy hiểm.", h, e },
            { p: "彼の知識は多分野にわたる。", a: "Kiến thức anh ấy trải nhiều lĩnh vực.", h, e },
            { p: "一週間にわたって雨が降り続いた。", a: "Mưa đã kéo dài suốt một tuần.", h, e },
          ],
          order: [
            { p: "Họp suốt ba ngày.", t: ["会議は", "三日間に", "わたって", "行われた。"], s: 2, h, e: e + " ★ là わたって." },
            { p: "Điều tra toàn quốc.", t: ["全国に", "わたる", "調査が", "実施された。"], s: 1, h, e: e + " ★ là わたる." },
            { p: "Hỗ trợ lâu dài.", t: ["長期間に", "わたり", "支援を", "続けた。"], s: 1, h, e: e + " ★ là わたり." },
            { p: "Triển lãm một tuần.", t: ["展示は", "一週間に", "わたって", "開かれた。"], s: 2, h, e: e + " ★ là わたって." },
            { p: "Tranh luận hai giờ.", t: ["二時間に", "わたって", "議論が", "続いた。"], s: 1, h, e: e + " ★ là わたって." },
            { p: "Dự án nhiều năm.", t: ["数年に", "わたる", "計画を", "立てた。"], s: 1, h, e: e + " ★ là わたる." },
            { p: "Mưa ảnh hưởng nhiều tỉnh.", t: ["数県に", "わたって", "大雨が", "降った。"], s: 1, h, e: e + " ★ là わたって." },
            { p: "Đàm phán cả ngày.", t: ["一日に", "わたって", "交渉が", "行われた。"], s: 1, h, e: e + " ★ là わたって." },
            { p: "Kiến thức nhiều lĩnh vực.", t: ["知識は", "多分野に", "わたって", "いる。"], s: 2, h, e: e + " ★ là わたって." },
            { p: "Mất điện phạm vi rộng.", t: ["広い範囲に", "わたる", "停電が", "起きた。"], s: 1, h, e: e + " ★ là わたる." },
          ],
        };
      })(),
    ),

    P(
      "l04-g04",
      {
        meaning: "Thông qua…; trong suốt…",
        structures: ["N ＋ を通じて", "N ＋ を通して"],
        explanation:
          "Hai nghĩa chính: (1) thông qua phương tiện/người trung gian; (2) trong suốt khoảng thời gian.",
        usage: "Quan hệ, truyền thông, trải nghiệm suốt một giai đoạn.",
        cautions: [
          "を通じて và を通して gần nghĩa; を通じて hơi trang trọng/viết hơn trong một số ngữ cảnh.",
          "Không nhầm với 通る (đi qua) thông thường.",
        ],
        contrast:
          "を通じて ≈ thông qua / suốt kỳ. Khác にわたって (phạm vi bao phủ) và をはじめ (tiêu biểu).",
        examples: [
          {
            ja: "友人を通じて彼を紹介された。",
            reading: "ゆうじんをつうじてかれをしょうかいされた。",
            vi: "Tôi được giới thiệu anh ấy thông qua bạn.",
            ruby: ruby([
              ["友人", "ゆうじん"], ["を"], ["通", "つう"], ["じて"],
              ["彼", "かれ"], ["を"], ["紹介", "しょうかい"], ["された。"],
            ]),
          },
          {
            ja: "一年を通して気温が高い。",
            reading: "いちねんをとおしてきおんがたかい。",
            vi: "Nhiệt độ cao suốt cả năm.",
            ruby: ruby([
              ["一年", "いちねん"], ["を"], ["通", "とお"], ["して"],
              ["気温", "きおん"], ["が"], ["高", "たか"], ["い。"],
            ]),
          },
          {
            ja: "インターネットを通じて情報を集めた。",
            reading: "いんたーねっとをつうじてじょうほうをあつめた。",
            vi: "Tôi thu thập thông tin thông qua internet.",
            ruby: ruby([
              ["インターネットを"], ["通", "つう"], ["じて"],
              ["情報", "じょうほう"], ["を"], ["集", "あつ"], ["めた。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng を通じて／を通して: thông qua phương tiện hoặc trong suốt khoảng thời gian.";
        const h = "N ＋ を通じて／を通して";
        return {
          viJa: [
            { p: "Tôi biết tin thông qua báo chí.", a: "新聞を通じてそのニュースを知った。", h, e },
            { p: "Suốt bốn mùa, nơi này đẹp.", a: "四季を通してここは美しい。", h, e },
            { p: "Thông qua thầy giáo, tôi gặp được cố vấn.", a: "先生を通じて顧問を紹介された。", h, e },
            { p: "Suốt kỳ nghỉ tôi ở nhà.", a: "休暇を通して家にいた。", h, e },
            { p: "Thông qua mạng xã hội, họ kết bạn.", a: "SNSを通じて彼らは友人になった。", h, e },
            { p: "Suốt cuộc đời ông ấy giúp người khác.", a: "生涯を通じて彼は人を助けた。", h, e },
            { p: "Thông qua phiên dịch, chúng tôi nói chuyện.", a: "通訳を通じて会話した。", h, e },
            { p: "Suốt mùa đông nhiệt độ thấp.", a: "冬を通して気温が低い。", h, e },
            { p: "Thông qua công ty, tôi xin visa.", a: "会社を通じてビザを申請した。", h, e },
            { p: "Suốt khóa học tôi giữ nhật ký.", a: "講座を通して日記をつけた。", h, e },
          ],
          jaVi: [
            { p: "彼を通じて話を聞いた。", a: "Tôi nghe chuyện thông qua anh ấy.", h, e },
            { p: "一年を通じて観光客が訪れる。", a: "Du khách đến thăm suốt cả năm.", h, e },
            { p: "ラジオを通して正しい情報を得た。", a: "Tôi có thông tin đúng qua đài radio.", h, e },
            { p: "経験を通じて多くを学んだ。", a: "Tôi học được nhiều thông qua trải nghiệm.", h, e },
            { p: "季節を通して花が咲く。", a: "Hoa nở suốt các mùa.", h, e },
            { p: "代理人を通じて交渉した。", a: "Đàm phán thông qua người đại diện.", h, e },
            { p: "学生時代を通して彼は優秀だった。", a: "Suốt thời sinh viên anh ấy xuất sắc.", h, e },
            { p: "映像を通じて現場の様子がわかった。", a: "Qua hình ảnh hiểu được hiện trường.", h, e },
            { p: "週末を通して雨が降った。", a: "Mưa rơi suốt cuối tuần.", h, e },
            { p: "ボランティアを通じて地域とつながった。", a: "Kết nối địa phương qua tình nguyện.", h, e },
          ],
          order: [
            { p: "Được giới thiệu qua bạn.", t: ["友人を", "通じて", "彼を", "紹介された。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Nhiệt độ cao suốt năm.", t: ["一年を", "通して", "気温が", "高い。"], s: 1, h, e: e + " ★ là 通して." },
            { p: "Thu thập tin qua mạng.", t: ["ネットを", "通じて", "情報を", "集めた。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Biết tin qua báo.", t: ["新聞を", "通じて", "ニュースを", "知った。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Đẹp suốt bốn mùa.", t: ["四季を", "通して", "景色が", "美しい。"], s: 1, h, e: e + " ★ là 通して." },
            { p: "Nói chuyện qua phiên dịch.", t: ["通訳を", "通じて", "話を", "した。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Ở nhà suốt kỳ nghỉ.", t: ["休暇を", "通して", "自宅に", "いた。"], s: 1, h, e: e + " ★ là 通して." },
            { p: "Xin visa qua công ty.", t: ["会社を", "通じて", "ビザを", "申請した。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Học qua trải nghiệm.", t: ["経験を", "通じて", "多くを", "学んだ。"], s: 1, h, e: e + " ★ là 通じて." },
            { p: "Mưa suốt cuối tuần.", t: ["週末を", "通して", "雨が", "降った。"], s: 1, h, e: e + " ★ là 通して." },
          ],
        };
      })(),
    ),

    P(
      "l04-g05",
      {
        meaning: "Trong phạm vi…; miễn là…; hết mức… (nghĩa tổng quát)",
        structures: ["Vる／Vない／Nの ＋ 限り"],
        explanation:
          "Nhóm 限り tổng quát ở bài 4: nêu phạm vi điều kiện hoặc giới hạn. Các biến thể cụ thể hơn (に限り, 限りでは…) ở bài 5.",
        usage: "Điều kiện 'miễn còn…'; phạm vi khả năng; giới hạn thời gian/đối tượng.",
        cautions: [
          "Đây là nhóm tổng quát (partial-match với TNĐG); bài 5 tách các dạng hẹp hơn.",
          "Không nhầm mọi 限り đều cùng một nghĩa.",
        ],
        contrast:
          "限り (tổng quát) bao nhiều sắc thái. Bài 5: に限り / 限りは / 限りでは / に限って cụ thể hơn.",
        examples: [
          {
            ja: "私の知る限り、彼は正直者だ。",
            reading: "わたしのしるかぎり、かれはしょうじきものだ。",
            vi: "Trong phạm vi tôi biết, anh ấy là người ngay thẳng.",
            ruby: ruby([
              ["私", "わたし"], ["の"], ["知", "し"], ["る"], ["限", "かぎ"], ["り、"],
              ["彼", "かれ"], ["は"], ["正直者", "しょうじきもの"], ["だ。"],
            ]),
          },
          {
            ja: "時間が許す限り手伝います。",
            reading: "じかんがゆるすかぎりてつだいます。",
            vi: "Miễn thời gian cho phép, tôi sẽ giúp.",
            ruby: ruby([
              ["時間", "じかん"], ["が"], ["許", "ゆる"], ["す"], ["限", "かぎ"], ["り"],
              ["手伝", "てつだ"], ["います。"],
            ]),
          },
          {
            ja: "力の限り走った。",
            reading: "ちからのかぎりはしった。",
            vi: "Tôi đã chạy hết sức.",
            ruby: ruby([["力", "ちから"], ["の"], ["限", "かぎ"], ["り"], ["走", "はし"], ["った。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng 限り (nghĩa tổng quát): phạm vi điều kiện / hết mức. Giữ đúng giới hạn nêu ra.";
        const h = "Vる／Nの ＋ 限り";
        return {
          viJa: [
            { p: "Trong phạm vi tôi nhớ, họp lúc 3 giờ.", a: "私の覚えている限り、会議は3時だ。", h, e },
            { p: "Miễn còn sức, tôi sẽ tiếp tục.", a: "体力がある限り続けます。", h, e },
            { p: "Tôi đã cố gắng hết mức có thể.", a: "できる限り努力した。", h, e },
            { p: "Miễn luật cho phép, hãy thử.", a: "法律が許す限り試してみてください。", h, e },
            { p: "Trong phạm vi ngân sách, chúng tôi mua.", a: "予算の限りで購入します。", h, e },
            { p: "Miễn còn sống ở đây, tôi sẽ đóng góp.", a: "ここに住んでいる限り貢献します。", h, e },
            { p: "Tôi hét hết sức.", a: "声の限り叫んだ。", h, e },
            { p: "Miễn chưa có thông báo, hãy chờ.", a: "連絡がない限り待ってください。", h, e },
            { p: "Trong phạm vi quy định, được miễn phí.", a: "規定の限り無料です。", h, e },
            { p: "Miễn còn làm việc ở công ty, hãy giữ bí mật.", a: "在職している限り秘密を守ってください。", h, e },
          ],
          jaVi: [
            { p: "見る限り問題はなさそうだ。", a: "Trong phạm vi nhìn thấy thì có vẻ không vấn đề.", h, e },
            { p: "命ある限り挑戦したい。", a: "Miễn còn sống, tôi muốn thử thách.", h, e },
            { p: "可能な限り早く提出します。", a: "Tôi sẽ nộp sớm hết mức có thể.", h, e },
            { p: "この情報が正しい限り方針は変えない。", a: "Miễn thông tin này đúng, không đổi phương châm.", h, e },
            { p: "私の知る限り彼は欠席していない。", a: "Trong phạm vi tôi biết, anh ấy không vắng.", h, e },
            { p: "ルールが変わる限り対応が必要だ。", a: "Miễn quy tắc thay đổi thì cần ứng phó.", h, e },
            { p: "力の限り応援する。", a: "Tôi sẽ cổ vũ hết sức.", h, e },
            { p: "必要がない限り連絡しないでください。", a: "Miễn không cần thiết thì đừng liên lạc.", h, e },
            { p: "天候が許す限り試合を行う。", a: "Miễn thời tiết cho phép sẽ tổ chức trận đấu.", h, e },
            { p: "覚えている限り書き出してみる。", a: "Tôi sẽ viết ra trong phạm vi còn nhớ.", h, e },
          ],
          order: [
            { p: "Trong phạm vi tôi biết anh ấy ngay thẳng.", t: ["私の知る", "限り、", "彼は", "正直者だ。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Miễn thời gian cho phép sẽ giúp.", t: ["時間が", "許す", "限り", "手伝います。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Chạy hết sức.", t: ["力の", "限り", "最後まで", "走った。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Cố hết mức có thể.", t: ["できる", "限り", "早く", "仕上げる。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Miễn còn sức sẽ tiếp tục.", t: ["体力が", "ある", "限り", "続けます。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Trong phạm vi nhìn thấy ổn.", t: ["見る", "限り", "問題は", "ない。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Miễn chưa có tin thì chờ.", t: ["連絡が", "ない", "限り", "待ってください。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Hét hết giọng.", t: ["声の", "限り", "名前を", "呼んだ。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Miễn luật cho phép hãy thử.", t: ["法律が", "許す", "限り", "挑戦しよう。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Nộp sớm hết mức.", t: ["可能な", "限り", "早めに", "提出する。"], s: 1, h, e: e + " ★ là 限り." },
          ],
        };
      })(),
    ),

    P(
      "l04-g06",
      {
        meaning: "Hết mức…; càng… càng… (mức độ / thỏa thích)",
        structures: ["Vる ＋ だけ", "Aい ＋ だけ", "N ＋ だけ"],
        explanation:
          "Ở bài này だけ theo nghĩa mức độ: làm hết mức có thể, lấy đủ mức cần (không phải 'chỉ mỗi' đơn thuần N3).",
        usage: "Khuyến khích làm thỏa thích; nêu tương quan mức độ.",
        cautions: [
          "Partial-match: các dạng だけに／だけあって thuộc bài khác.",
          "Phân biệt với だけ = chỉ mỗi (giới hạn đối tượng).",
        ],
        contrast:
          "だけ (mức độ) ≈ hết mức / tương ứng mức. Khác 限り (điều kiện phạm vi) và に限って (đúng vào lúc).",
        examples: [
          {
            ja: "好きなだけ取ってください。",
            reading: "すきなだけとってください。",
            vi: "Hãy lấy thỏa thích bao nhiêu cũng được.",
            ruby: ruby([["好", "す"], ["きなだけ"], ["取", "と"], ["ってください。"]]),
          },
          {
            ja: "やれるだけやってみよう。",
            reading: "やれるだけやってみよう。",
            vi: "Hãy làm hết mức có thể.",
            ruby: ruby([["やれるだけやってみよう。"]]),
          },
          {
            ja: "時間があるだけ練習した。",
            reading: "じかんがあるだけれんしゅうした。",
            vi: "Tôi đã luyện tập hết thời gian có được.",
            ruby: ruby([["時間", "じかん"], ["があるだけ"], ["練習", "れんしゅう"], ["した。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng だけ theo nghĩa mức độ: hết mức / thỏa thích. Không nhầm với 'chỉ mỗi' đơn thuần.";
        const h = "Vる／Aい ＋ だけ";
        return {
          viJa: [
            { p: "Hãy ăn thỏa thích.", a: "食べたいだけ食べてください。", h, e },
            { p: "Tôi đã mang hết số sách có thể mang.", a: "持てるだけ本を持った。", h, e },
            { p: "Hãy nghỉ ngơi hết mức cần thiết.", a: "必要なだけ休憩してください。", h, e },
            { p: "Tôi sẽ giúp hết sức có thể.", a: "できるだけ手伝います。", h, e },
            { p: "Hãy viết dài bao nhiêu cũng được.", a: "書きたいだけ書いていいです。", h, e },
            { p: "Tôi đã luyện hết thời gian còn lại.", a: "残った時間だけ練習した。", h, e },
            { p: "Hãy lấy nước bao nhiêu cần.", a: "必要なだけ水を取ってください。", h, e },
            { p: "Tôi đã hỏi hết những gì muốn hỏi.", a: "聞きたいだけ質問した。", h, e },
            { p: "Hãy cố hết mức trước hạn.", a: "期限までやれるだけ頑張ろう。", h, e },
            { p: "Tôi ngủ đủ mức cần để hồi phục.", a: "回復に必要なだけ眠った。", h, e },
          ],
          jaVi: [
            { p: "欲しいだけ選んでください。", a: "Hãy chọn thỏa thích những gì muốn.", h, e },
            { p: "言えるだけ言ってみた。", a: "Tôi đã nói hết mức có thể nói.", h, e },
            { p: "節約できるだけ節約しよう。", a: "Hãy tiết kiệm hết mức có thể.", h, e },
            { p: "彼は走れるだけ走った。", a: "Anh ấy đã chạy hết mức có thể chạy.", h, e },
            { p: "考えられるだけ案を出した。", a: "Tôi đã đưa ra hết các phương án nghĩ được.", h, e },
            { p: "好きなだけ練習してかまわない。", a: "Luyện thỏa thích cũng không sao.", h, e },
            { p: "持てるだけ荷物を運んだ。", a: "Tôi đã chuyển hết hành lý mang được.", h, e },
            { p: "わかるだけ説明します。", a: "Tôi sẽ giải thích hết mức hiểu được.", h, e },
            { p: "時間があるだけ読書した。", a: "Tôi đã đọc sách hết thời gian có.", h, e },
            { p: "必要なだけ準備を整えた。", a: "Tôi đã chuẩn bị đủ mức cần thiết.", h, e },
          ],
          order: [
            { p: "Lấy thỏa thích.", t: ["好きな", "だけ", "取って", "ください。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Làm hết mức có thể.", t: ["やれる", "だけ", "やって", "みよう。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Luyện hết thời gian có.", t: ["時間がある", "だけ", "練習", "した。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Ăn thỏa thích.", t: ["食べたい", "だけ", "食べて", "いい。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Mang hết mức mang được.", t: ["持てる", "だけ", "本を", "持った。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Giúp hết mức có thể.", t: ["できる", "だけ", "サポート", "します。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Hỏi hết những gì muốn.", t: ["聞きたい", "だけ", "質問して", "ください。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Nghỉ đủ mức cần.", t: ["必要な", "だけ", "休んで", "ください。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Nói hết mức nói được.", t: ["言える", "だけ", "意見を", "述べた。"], s: 1, h, e: e + " ★ là だけ." },
            { p: "Chọn thỏa thích.", t: ["欲しい", "だけ", "選んで", "かまわない。"], s: 1, h, e: e + " ★ là だけ." },
          ],
        };
      })(),
    ),
  ];
}
