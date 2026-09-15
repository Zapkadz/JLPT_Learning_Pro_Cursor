import { ruby } from "./_util.mjs";

export function lesson05Patterns(byId, makePattern) {
  const P = (id, theory, pack) => makePattern(byId(id), theory, pack, 5);

  return [
    P(
      "l05-g01",
      {
        meaning: "Chỉ…; riêng… (giới hạn đối tượng / thời điểm đặc biệt)",
        structures: ["N ＋ に限り"],
        explanation:
          "Giới hạn đối tượng hoặc thời điểm được áp dụng đặc biệt (thường thông báo, ưu đãi).",
        usage: "Biển hiệu cửa hàng, thông báo: chỉ hôm nay, chỉ hội viên…",
        cautions: [
          "に限り mang sắc thái thông báo/viết hơn だけ trong nhiều ngữ cảnh trang trọng.",
          "Khác に限って (đúng vào lúc… lại…).",
        ],
        contrast:
          "に限り ≈ chỉ áp dụng cho. Khác 限りでは (trong phạm vi nhận thức) và に限って (nghịch lý thời điểm).",
        examples: [
          {
            ja: "本日に限り全品半額です。",
            reading: "ほんじつにかぎりぜんぴんはんがくです。",
            vi: "Chỉ hôm nay toàn bộ hàng giảm nửa giá.",
            ruby: ruby([
              ["本日", "ほんじつ"], ["に"], ["限", "かぎ"], ["り"],
              ["全品", "ぜんぴん"], ["半額", "はんがく"], ["です。"],
            ]),
          },
          {
            ja: "会員に限り入場できます。",
            reading: "かいいんにかぎりにゅうじょうできます。",
            vi: "Chỉ hội viên mới vào được.",
            ruby: ruby([
              ["会員", "かいいん"], ["に"], ["限", "かぎ"], ["り"],
              ["入場", "にゅうじょう"], ["できます。"],
            ]),
          },
          {
            ja: "先着100名に限りプレゼントを差し上げます。",
            reading: "せんちゃくひゃくめいにかぎりぷれぜんとをさしあげます。",
            vi: "Chỉ 100 người đến trước được tặng quà.",
            ruby: ruby([
              ["先着", "せんちゃく"], ["100"], ["名", "めい"], ["に"], ["限", "かぎ"], ["り"],
              ["プレゼントを"], ["差", "さ"], ["し上げます。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng に限り để giới hạn đối tượng/thời điểm đặc biệt (thông báo, ưu đãi).";
        const h = "N ＋ に限り";
        return {
          viJa: [
            { p: "Chỉ cuối tuần mới mở cửa.", a: "週末に限り営業します。", h, e },
            { p: "Chỉ học sinh được giảm giá.", a: "学生に限り割引があります。", h, e },
            { p: "Chỉ hôm nay miễn phí gửi hành lý.", a: "本日に限り荷物預かりが無料です。", h, e },
            { p: "Chỉ thành viên mới tải được.", a: "会員に限りダウンロードできます。", h, e },
            { p: "Chỉ buổi sáng bán bánh này.", a: "午前中に限りこのパンを販売します。", h, e },
            { p: "Chỉ khách đặt trước được ưu tiên.", a: "予約者に限り優先されます。", h, e },
            { p: "Chỉ tháng này phí vào cửa giảm.", a: "今月に限り入場料が安くなります。", h, e },
            { p: "Chỉ người cao tuổi được ngồi ghế này.", a: "高齢者に限りこの席を利用できます。", h, e },
            { p: "Chỉ ngày lễ tàu chạy thêm.", a: "祝日に限り臨時列車が出ます。", h, e },
            { p: "Chỉ đơn hàng trên 5000 yên được miễn ship.", a: "5000円以上の注文に限り送料無料です。", h, e },
          ],
          jaVi: [
            { p: "本日に限り入場無料です。", a: "Chỉ hôm nay vào cửa miễn phí.", h, e },
            { p: "女性に限りサービスします。", a: "Chỉ phục vụ cho nữ.", h, e },
            { p: "平日に限りこの料金です。", a: "Chỉ ngày thường mới áp dụng mức phí này.", h, e },
            { p: "子どもに限り半額になります。", a: "Chỉ trẻ em được giảm nửa giá.", h, e },
            { p: "オンライン申込に限り特典があります。", a: "Chỉ đăng ký online mới có ưu đãi.", h, e },
            { p: "初回に限り体験できます。", a: "Chỉ lần đầu mới được trải nghiệm.", h, e },
            { p: "現金支払いに限り割引します。", a: "Chỉ thanh toán tiền mặt mới giảm giá.", h, e },
            { p: "招待客に限り裏口から入れます。", a: "Chỉ khách mời được vào cửa sau.", h, e },
            { p: "雨の日に限り室内で行います。", a: "Chỉ ngày mưa mới tổ chức trong nhà.", h, e },
            { p: "期間中に限り再入場が可能です。", a: "Chỉ trong thời gian sự kiện mới vào lại được.", h, e },
          ],
          order: [
            { p: "Chỉ hôm nay nửa giá.", t: ["本日に", "限り", "全品", "半額です。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ hội viên vào được.", t: ["会員に", "限り", "入場", "できます。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ 100 người đến trước có quà.", t: ["先着100名に", "限り", "プレゼントを", "差し上げます。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ cuối tuần mở cửa.", t: ["週末に", "限り", "店を", "開けます。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ học sinh được giảm.", t: ["学生に", "限り", "割引が", "あります。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ buổi sáng bán.", t: ["午前中に", "限り", "販売", "します。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ thành viên tải được.", t: ["会員に", "限り", "ダウンロード", "可能です。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ tháng này phí rẻ.", t: ["今月に", "限り", "料金が", "安いです。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ ngày lễ có tàu thêm.", t: ["祝日に", "限り", "臨時便が", "出ます。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chỉ đặt trước được ưu tiên.", t: ["予約者に", "限り", "優先席を", "ご用意します。"], s: 1, h, e: e + " ★ là 限り." },
          ],
        };
      })(),
    ),

    P(
      "l05-g02",
      {
        meaning: "Miễn là / chừng nào còn… thì…",
        structures: ["Vる／Vない／Aい ＋ 限り（は）"],
        explanation:
          "Nêu điều kiện còn giữ nguyên thì kết quả/phán đoán vẫn đúng. 限りは nhấn mạnh điều kiện.",
        usage: "Cam kết, quy tắc: miễn còn… sẽ…",
        cautions: [
          "Gần với うちは nhưng 限り（は） thiên về điều kiện logic hơn.",
          "Khác 限りでは (giới hạn nguồn nhận thức).",
        ],
        contrast:
          "限り（は） ≈ chừng nào còn A thì B. Khác に限り (chỉ đối tượng) và 限りでは (theo những gì tôi…).",
        examples: [
          {
            ja: "ここにいる限りは安全だ。",
            reading: "ここにいるかぎりはあんぜんだ。",
            vi: "Chừng nào còn ở đây thì an toàn.",
            ruby: ruby([["ここにいる"], ["限", "かぎ"], ["りは"], ["安全", "あんぜん"], ["だ。"]]),
          },
          {
            ja: "秘密を守る限り協力する。",
            reading: "ひみつをまもるかぎりきょうりょくする。",
            vi: "Miễn là giữ bí mật, tôi sẽ hợp tác.",
            ruby: ruby([["秘密", "ひみつ"], ["を"], ["守", "まも"], ["る"], ["限", "かぎ"], ["り"], ["協力", "きょうりょく"], ["する。"]]),
          },
          {
            ja: "元気な限り働きたい。",
            reading: "げんきなかぎりはたらきたい。",
            vi: "Miễn còn khỏe, tôi muốn làm việc.",
            ruby: ruby([["元気", "げんき"], ["な"], ["限", "かぎ"], ["り"], ["働", "はたら"], ["きたい。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng 限り（は）: chừng nào còn điều kiện A thì B. Giữ đúng quan hệ điều kiện–kết quả.";
        const h = "Vる／Aい ＋ 限り（は）";
        return {
          viJa: [
            { p: "Chừng nào còn làm ở đây, hãy tuân thủ quy định.", a: "ここで働く限りは規則を守ってください。", h, e },
            { p: "Miễn còn mưa, trận đấu tạm dừng.", a: "雨が降っている限り試合は中止だ。", h, e },
            { p: "Chừng nào còn khỏe, tôi đi bộ mỗi ngày.", a: "元気な限り毎日歩く。", h, e },
            { p: "Miễn chưa có lệnh mới, hãy tiếp tục.", a: "新しい指示がない限り続けてください。", h, e },
            { p: "Chừng nào còn là hội viên, được dùng phòng.", a: "会員である限り部屋を使える。", h, e },
            { p: "Miễn còn sống ở Nhật, tôi học tiếng Nhật.", a: "日本に住んでいる限り日本語を勉強する。", h, e },
            { p: "Chừng nào còn nợ, tôi không mua xe.", a: "借金がある限り車は買わない。", h, e },
            { p: "Miễn còn hỗ trợ, dự án tiếp tục.", a: "支援がある限りプロジェクトは続く。", h, e },
            { p: "Chừng nào còn trẻ, hãy thử nhiều thứ.", a: "若い限りは色々挑戦したほうがいい。", h, e },
            { p: "Miễn chưa thay đổi luật, quy tắc này còn hiệu lực.", a: "法律が変わらない限りこのルールは有効だ。", h, e },
          ],
          jaVi: [
            { p: "ここにいる限り心配はいらない。", a: "Chừng nào còn ở đây thì không cần lo.", h, e },
            { p: "努力する限り結果はついてくる。", a: "Miễn còn cố gắng thì kết quả sẽ theo.", h, e },
            { p: "彼が反対しない限り進めよう。", a: "Miễn anh ấy không phản đối thì hãy tiến hành.", h, e },
            { p: "健康な限り好きな仕事をしたい。", a: "Miễn còn khỏe, tôi muốn làm việc mình thích.", h, e },
            { p: "資金がある限り研究を続ける。", a: "Miễn còn vốn, tiếp tục nghiên cứu.", h, e },
            { p: "問題が残っている限り安心できない。", a: "Chừng nào còn vấn đề thì chưa yên tâm.", h, e },
            { p: "契約が有効な限り守る必要がある。", a: "Miễn hợp đồng còn hiệu lực thì cần tuân thủ.", h, e },
            { p: "私が責任者である限り最終決定は私がする。", a: "Chừng nào tôi còn là người phụ trách thì tôi quyết cuối.", h, e },
            { p: "天候が悪くない限り出発する。", a: "Miễn thời tiết không xấu thì khởi hành.", h, e },
            { p: "証拠がない限り犯人とは言えない。", a: "Miễn chưa có bằng chứng thì không thể gọi là thủ phạm.", h, e },
          ],
          order: [
            { p: "Chừng nào ở đây thì an toàn.", t: ["ここにいる", "限りは", "安全", "だ。"], s: 1, h, e: e + " ★ là 限りは." },
            { p: "Miễn giữ bí mật sẽ hợp tác.", t: ["秘密を", "守る", "限り", "協力する。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Miễn còn khỏe muốn làm việc.", t: ["元気な", "限り", "働き", "たい。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Chừng nào làm ở đây hãy tuân thủ.", t: ["ここで働く", "限りは", "規則を", "守れ。"], s: 1, h, e: e + " ★ là 限りは." },
            { p: "Miễn còn mưa thì dừng.", t: ["雨が降っている", "限り", "試合は", "中止だ。"], s: 1, h, e: e + " ★ là 限り." },
            { p: "Miễn chưa có lệnh mới hãy tiếp.", t: ["指示が", "ない", "限り", "続けよ。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Chừng nào còn hội viên được dùng.", t: ["会員で", "ある", "限り", "利用できる。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Miễn còn nợ không mua xe.", t: ["借金が", "ある", "限り", "買わない。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Miễn còn vốn nghiên cứu tiếp.", t: ["資金が", "ある", "限り", "続ける。"], s: 2, h, e: e + " ★ là 限り." },
            { p: "Miễn luật không đổi còn hiệu lực.", t: ["法律が", "変わらない", "限り", "有効だ。"], s: 2, h, e: e + " ★ là 限り." },
          ],
        };
      })(),
    ),

    P(
      "l05-g03",
      {
        meaning: "Trong phạm vi… / theo những gì… (giới hạn nguồn nhận thức)",
        structures: ["Vる／Nの ＋ 限りでは"],
        explanation:
          "Giới hạn phán đoán trong phạm vi thông tin người nói nắm được; thường kèm sắc thái khiêm tốn.",
        usage: "Báo cáo, nhận xét thận trọng: 'theo tôi biết…'.",
        cautions: [
          "Phần sau là phán đoán dựa trên phạm vi đó.",
          "Khác 限りは (điều kiện còn giữ).",
        ],
        contrast:
          "限りでは ≈ theo phạm vi nhận thức. Khác に限り (giới hạn đối tượng) và に限って (đúng lúc lại).",
        examples: [
          {
            ja: "私の知る限りでは、彼は欠席していない。",
            reading: "わたしのしるかぎりでは、かれはけっせきしていない。",
            vi: "Theo những gì tôi biết, anh ấy không vắng mặt.",
            ruby: ruby([
              ["私", "わたし"], ["の"], ["知", "し"], ["る"], ["限", "かぎ"], ["りでは、"],
              ["彼", "かれ"], ["は"], ["欠席", "けっせき"], ["していない。"],
            ]),
          },
          {
            ja: "調べた限りでは問題は見つからなかった。",
            reading: "しらべたかぎりではもんだいはみつからなかった。",
            vi: "Trong phạm vi đã kiểm tra, không thấy vấn đề.",
            ruby: ruby([
              ["調", "しら"], ["べた"], ["限", "かぎ"], ["りでは"],
              ["問題", "もんだい"], ["は"], ["見", "み"], ["つからなかった。"],
            ]),
          },
          {
            ja: "このデータ限りでは結論を出せない。",
            reading: "このでーたかぎりではけつろんをだせない。",
            vi: "Chỉ với dữ liệu này thì chưa đưa ra kết luận được.",
            ruby: ruby([
              ["この"], ["データ"], ["限", "かぎ"], ["りでは"],
              ["結論", "けつろん"], ["を"], ["出", "だ"], ["せない。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng 限りでは: phán đoán trong phạm vi nhận thức/thông tin hiện có. Giữ sắc thái thận trọng.";
        const h = "Vる／Nの ＋ 限りでは";
        return {
          viJa: [
            { p: "Theo tôi nhớ thì họp lúc 10 giờ.", a: "覚えている限りでは会議は10時だ。", h, e },
            { p: "Trong phạm vi đã đọc, không có lỗi.", a: "読んだ限りでは誤りはない。", h, e },
            { p: "Theo những gì nghe được, anh ấy ổn.", a: "聞いている限りでは彼は元気だ。", h, e },
            { p: "Với tài liệu này thì chưa đủ.", a: "この資料限りでは不十分だ。", h, e },
            { p: "Trong phạm vi quan sát, máy chạy bình thường.", a: "見る限りでは機械は正常だ。", h, e },
            { p: "Theo báo cáo thì doanh số tăng.", a: "報告の限りでは売上げは増えている。", h, e },
            { p: "Trong phạm vi thử nghiệm, kết quả tốt.", a: "試験した限りでは結果は良好だ。", h, e },
            { p: "Theo kinh nghiệm tôi, cách này hiệu quả.", a: "経験の限りではこの方法が有効だ。", h, e },
            { p: "Trong phạm vi bản đồ, đường này ngắn nhất.", a: "地図の限りではこの道が一番短い。", h, e },
            { p: "Theo những gì tôi biết, cửa hàng đóng cửa.", a: "知る限りではその店は閉店した。", h, e },
          ],
          jaVi: [
            { p: "私の知る限りでは彼は来ていない。", a: "Theo tôi biết, anh ấy chưa đến.", h, e },
            { p: "確認した限りでは在庫はある。", a: "Trong phạm vi đã xác nhận thì còn hàng.", h, e },
            { p: "この記録限りでは欠席は一度もない。", a: "Theo hồ sơ này thì chưa vắng lần nào.", h, e },
            { p: "聞いた限りでは問題は解決した。", a: "Theo những gì nghe được, vấn đề đã giải quyết.", h, e },
            { p: "見た限りでは異常はない。", a: "Trong phạm vi nhìn thấy thì không bất thường.", h, e },
            { p: "調べた限りでは同じ事例はない。", a: "Trong phạm vi đã tra thì không có vụ tương tự.", h, e },
            { p: "データ限りでは判断を保留する。", a: "Chỉ với dữ liệu thì tạm giữ phán đoán.", h, e },
            { p: "記憶の限りでは昨日が締め切りだった。", a: "Theo trí nhớ tôi, hạn là hôm qua.", h, e },
            { p: "ニュースの限りでは被害は小さい。", a: "Theo tin tức thì thiệt hại nhỏ.", h, e },
            { p: "今把握している限りでは全員無事だ。", a: "Trong phạm vi nắm được hiện nay, mọi người bình an.", h, e },
          ],
          order: [
            { p: "Theo tôi biết anh ấy không vắng.", t: ["知る", "限りでは", "彼は", "欠席していない。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Trong phạm vi kiểm tra không thấy lỗi.", t: ["調べた", "限りでは", "問題は", "ない。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Với dữ liệu này chưa kết luận.", t: ["このデータ", "限りでは", "結論を", "出せない。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Theo tôi nhớ họp lúc 10 giờ.", t: ["覚えている", "限りでは", "10時", "だ。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Trong phạm vi đọc không có lỗi.", t: ["読んだ", "限りでは", "誤りは", "ない。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Theo những gì nghe anh ấy ổn.", t: ["聞いている", "限りでは", "元気", "だ。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Trong phạm vi nhìn máy bình thường.", t: ["見る", "限りでは", "正常に", "動いている。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Theo báo cáo doanh số tăng.", t: ["報告の", "限りでは", "売上げが", "増えた。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Theo hồ sơ chưa từng vắng.", t: ["記録の", "限りでは", "欠席は", "ない。"], s: 1, h, e: e + " ★ là 限りでは." },
            { p: "Theo tin tức thiệt hại nhỏ.", t: ["ニュースの", "限りでは", "被害は", "軽い。"], s: 1, h, e: e + " ★ là 限りでは." },
          ],
        };
      })(),
    ),

    P(
      "l05-g04",
      {
        meaning: "Đúng vào lúc… lại…; chỉ riêng… thì… (nghịch lý / đặc biệt)",
        structures: ["N ＋ に限って"],
        explanation:
          "Thường mang sắc thái 'đúng lúc quan trọng lại xảy ra điều không mong muốn', hoặc nhấn mạnh trường hợp đặc biệt.",
        usage: "Phàn nàn nhẹ, kể chuyện đời thường; cũng dùng giới hạn đối tượng mang sắc thái nhấn mạnh.",
        cautions: [
          "Khác に限り (thông báo giới hạn trung tính).",
          "Hay đi với sự việc trái mong đợi.",
        ],
        contrast:
          "に限って ≈ đúng vào… lại…. Khác に限り (chỉ áp dụng) và 限りでは (phạm vi nhận thức).",
        examples: [
          {
            ja: "急いでいるときに限って電車が遅れる。",
            reading: "いそいでいるときにかぎってでんしゃがおくれる。",
            vi: "Đúng lúc đang vội thì tàu lại trễ.",
            ruby: ruby([
              ["急", "いそ"], ["いでいるときに"], ["限", "かぎ"], ["って"],
              ["電車", "でんしゃ"], ["が"], ["遅", "おく"], ["れる。"],
            ]),
          },
          {
            ja: "彼に限ってそんなことはしない。",
            reading: "かれにかぎってそんなことはしない。",
            vi: "Riêng anh ấy thì không làm chuyện như vậy.",
            ruby: ruby([["彼", "かれ"], ["に"], ["限", "かぎ"], ["って"], ["そんなことはしない。"]]),
          },
          {
            ja: "大切な日に限って天気が悪い。",
            reading: "たいせつなひにかぎっててんきがわるい。",
            vi: "Đúng vào ngày quan trọng thì thời tiết lại xấu.",
            ruby: ruby([
              ["大切", "たいせつ"], ["な"], ["日", "ひ"], ["に"], ["限", "かぎ"], ["って"],
              ["天気", "てんき"], ["が"], ["悪", "わる"], ["い。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng に限って: đúng vào lúc/trường hợp… lại…, hoặc nhấn mạnh riêng đối tượng. Giữ sắc thái đặc biệt/nghịch lý.";
        const h = "N ＋ に限って";
        return {
          viJa: [
            { p: "Đúng lúc không mang ô thì trời mưa.", a: "傘を持っていない日に限って雨が降る。", h, e },
            { p: "Riêng hôm nay máy lại hỏng.", a: "今日に限って機械が故障した。", h, e },
            { p: "Đúng lúc cần im lặng thì điện thoại reo.", a: "静かにすべきときに限って電話が鳴る。", h, e },
            { p: "Riêng anh ấy thì tôi tin được.", a: "彼に限って信じられる。", h, e },
            { p: "Đúng ngày thi thì bị cảm.", a: "試験の日に限って風邪をひく。", h, e },
            { p: "Riêng cửa hàng này thì luôn đông.", a: "この店に限っていつも混んでいる。", h, e },
            { p: "Đúng lúc hết pin thì cần đèn pin.", a: "電池がなくなったときに限って懐中電灯が必要になる。", h, e },
            { p: "Riêng lần này thì hãy bỏ qua.", a: "今回に限って許してください。", h, e },
            { p: "Đúng lúc họp quan trọng thì đường kẹt.", a: "重要な会議のときに限って道が混む。", h, e },
            { p: "Riêng con tôi thì không nói dối.", a: "うちの子に限って嘘はつかない。", h, e },
          ],
          jaVi: [
            { p: "忙しいときに限って客が来る。", a: "Đúng lúc bận thì khách lại đến.", h, e },
            { p: "彼女に限って遅刻しない。", a: "Riêng cô ấy thì không đến muộn.", h, e },
            { p: "休みの日に限って天気が崩れる。", a: "Đúng ngày nghỉ thì thời tiết lại xấu.", h, e },
            { p: "必要なときに限って見つからない。", a: "Đúng lúc cần thì lại không tìm thấy.", h, e },
            { p: "この道に限って工事中だ。", a: "Riêng con đường này thì đang thi công.", h, e },
            { p: "提出日前日に限って調子が悪い。", a: "Đúng ngày trước hạn nộp thì tình trạng lại xấu.", h, e },
            { p: "彼に限ってそんなミスはしないはずだ。", a: "Riêng anh ấy lẽ ra không mắc lỗi như vậy.", h, e },
            { p: "写真を撮るときに限って笑顔になれない。", a: "Đúng lúc chụp ảnh thì lại không cười được.", h, e },
            { p: "今夜に限って残業できない。", a: "Riêng tối nay thì không tăng ca được.", h, e },
            { p: "大切な話の最中に限って邪魔が入る。", a: "Đúng giữa lúc chuyện quan trọng thì lại bị làm phiền.", h, e },
          ],
          order: [
            { p: "Đúng lúc vội thì tàu trễ.", t: ["急いでいるときに", "限って", "電車が", "遅れる。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Riêng anh ấy không làm vậy.", t: ["彼に", "限って", "そんなことは", "しない。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Đúng ngày quan trọng trời xấu.", t: ["大切な日に", "限って", "天気が", "悪い。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Đúng lúc không mang ô thì mưa.", t: ["傘がない日に", "限って", "雨が", "降る。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Riêng hôm nay máy hỏng.", t: ["今日に", "限って", "故障", "した。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Đúng ngày thi bị cảm.", t: ["試験の日に", "限って", "風邪を", "ひく。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Riêng cô ấy không muộn.", t: ["彼女に", "限って", "遅刻は", "しない。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Đúng lúc bận khách đến.", t: ["忙しいときに", "限って", "客が", "来る。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Riêng lần này hãy bỏ qua.", t: ["今回に", "限って", "許して", "ください。"], s: 1, h, e: e + " ★ là 限って." },
            { p: "Đúng lúc cần lại không thấy.", t: ["必要なときに", "限って", "見つから", "ない。"], s: 1, h, e: e + " ★ là 限って." },
          ],
        };
      })(),
    ),
  ];
}
