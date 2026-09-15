import { ruby } from "./_util.mjs";

const eSaichuu =
  "Câu dùng 最中 để nhấn mạnh đang đúng giữa một hành động/sự kiện. Giữ đúng thời điểm và hành động kèm theo.";
const hN = "Nの ＋ 最中（だ／に）";
const hV = "Vている ＋ 最中（だ／に）";

export function lesson02Patterns(byId, makePattern) {
  const P = (id, theory, pack) => makePattern(byId(id), theory, pack, 2);

  return [
    P(
      "l02-g01",
      {
        meaning: "Đang ngay giữa lúc; đúng lúc đang làm / đang xảy ra",
        structures: ["Nの ＋ 最中（だ／に）", "Vている ＋ 最中（だ／に）"],
        explanation:
          "Nêu thời điểm đang ở giữa một hành động hoặc sự kiện. Thường mang sắc thái đang bận hoặc đang trong lúc đó.",
        usage: "Tin tức, tường thuật, xin lỗi vì đang bận; nhấn mạnh 'đúng giữa lúc'.",
        cautions: [
          "Không dùng cho trạng thái tĩnh kéo dài không có cảm giác 'đang giữa'.",
          "最中だ kết thúc câu; 最中に nối hành động khác xảy ra lúc đó.",
        ],
        contrast:
          "最中だ nhấn 'đúng giữa lúc đang diễn ra', mạnh hơn ている thông thường. Khác うちに (tranh thủ / trong khi còn).",
        examples: [
          {
            ja: "会議の最中に携帯電話が鳴ってしまった。",
            reading: "かいぎのさいちゅうにけいたいでんわがなってしまった。",
            vi: "Đúng giữa cuộc họp, điện thoại di động đã reo lên.",
            ruby: ruby([
              ["会議", "かいぎ"], ["の"], ["最中", "さいちゅう"], ["に"],
              ["携帯", "けいたい"], ["電話", "でんわ"], ["が"], ["鳴", "な"], ["ってしまった。"],
            ]),
          },
          {
            ja: "料理をしている最中だ。",
            reading: "りょうりをしているさいちゅうだ。",
            vi: "Tôi đang giữa lúc nấu ăn.",
            ruby: ruby([["料理", "りょうり"], ["をしている"], ["最中", "さいちゅう"], ["だ。"]]),
          },
          {
            ja: "試験の最中は静かにしてください。",
            reading: "しけんのさいちゅうはしずかにしてください。",
            vi: "Trong lúc đang thi, xin hãy giữ yên lặng.",
            ruby: ruby([
              ["試験", "しけん"], ["の"], ["最中", "さいちゅう"], ["は"],
              ["静", "しず"], ["かにしてください。"],
            ]),
          },
        ],
      },
      {
        viJa: [
          { p: "Đúng giữa buổi thuyết trình, điện bị cắt.", a: "発表の最中に停電した。", h: hN, e: eSaichuu },
          { p: "Tôi đang giữa lúc viết báo cáo.", a: "報告書を書いている最中だ。", h: hV, e: eSaichuu },
          { p: "Xin lỗi, tôi đang giữa cuộc họp.", a: "すみません、会議の最中です。", h: hN, e: eSaichuu },
          { p: "Đúng giữa trận đấu, trời đổ mưa.", a: "試合の最中に雨が降ってきた。", h: hN, e: eSaichuu },
          { p: "Đừng gọi điện khi đang giữa giờ học.", a: "授業の最中に電話をかけないでください。", h: hN, e: eSaichuu },
          { p: "Tôi đang giữa lúc nói chuyện với khách.", a: "客と話している最中だ。", h: hV, e: eSaichuu },
          { p: "Đúng giữa lúc đang xem phim, chuông cửa reo.", a: "映画を見ている最中にドアのベルが鳴った。", h: hV, e: eSaichuu },
          { p: "Trong lúc đang kiểm tra, hãy giữ trật tự.", a: "点検の最中は秩序を保ってください。", h: hN, e: eSaichuu },
          { p: "Tôi đang giữa lúc chuẩn bị tài liệu.", a: "資料を準備している最中です。", h: hV, e: eSaichuu },
          { p: "Đúng giữa chuyến đi, xe buýt bị hỏng.", a: "旅行の最中にバスが故障した。", h: hN, e: eSaichuu },
        ],
        jaVi: [
          { p: "食事の最中に電話がかかってきた。", a: "Đúng giữa bữa ăn, điện thoại reo.", h: hN, e: eSaichuu },
          { p: "彼は今、作業の最中だ。", a: "Anh ấy hiện đang giữa lúc làm việc.", h: hN, e: eSaichuu },
          { p: "討論している最中に意見が対立した。", a: "Đúng giữa lúc thảo luận, ý kiến đối lập nhau.", h: hV, e: eSaichuu },
          { p: "撮影の最中は動かないでください。", a: "Trong lúc đang quay, xin đừng cử động.", h: hN, e: eSaichuu },
          { p: "面接の最中に緊張してしまった。", a: "Đúng giữa buổi phỏng vấn, tôi đã căng thẳng.", h: hN, e: eSaichuu },
          { p: "今は引っ越しの最中です。", a: "Hiện tôi đang giữa lúc chuyển nhà.", h: hN, e: eSaichuu },
          { p: "運転している最中に眠くなった。", a: "Đúng lúc đang lái xe, tôi buồn ngủ.", h: hV, e: eSaichuu },
          { p: "式の最中に子供が泣き出した。", a: "Đúng giữa buổi lễ, đứa trẻ khóc.", h: hN, e: eSaichuu },
          { p: "修理している最中だから、触れないで。", a: "Vì đang giữa lúc sửa, đừng chạm vào.", h: hV, e: eSaichuu },
          { p: "試合の最中は応援を続けよう。", a: "Hãy tiếp tục cổ vũ trong suốt trận đấu.", h: hN, e: eSaichuu },
        ],
        order: [
          { p: "Đúng giữa cuộc họp, chuông báo cháy reo.", t: ["会議の", "最中に", "火災報知器が", "鳴った。"], s: 1, h: hN, e: eSaichuu + " Ghép bốn mảnh; ★ là mảnh chứa 最中." },
          { p: "Tôi đang giữa lúc học từ vựng.", t: ["今は", "単語を", "覚えている", "最中だ。"], s: 3, h: hV, e: eSaichuu + " ★ là 最中だ." },
          { p: "Trong lúc đang phẫu thuật, hãy tắt điện thoại.", t: ["手術の", "最中は", "携帯電話を", "切ってください。"], s: 1, h: hN, e: eSaichuu + " ★ là 最中は." },
          { p: "Đúng lúc đang chạy, tôi bị ngã.", t: ["走っている", "最中に", "転んで", "しまった。"], s: 1, h: hV, e: eSaichuu + " ★ là 最中に." },
          { p: "Xin lỗi vì gọi giữa lúc anh ấy đang ngủ.", t: ["彼が", "寝ている", "最中に", "電話してしまった。"], s: 2, h: hV, e: eSaichuu + " ★ là 最中に." },
          { p: "Giữa trận bóng, trọng tài thổi còi.", t: ["サッカーの", "最中に", "審判が", "笛を吹いた。"], s: 1, h: hN, e: eSaichuu + " ★ là 最中に." },
          { p: "Tôi đang giữa lúc dọn phòng.", t: ["部屋を", "片付けている", "最中です", "から。"], s: 2, h: hV, e: eSaichuu + " ★ là 最中です." },
          { p: "Trong lúc hội nghị, máy ảnh bị cấm.", t: ["会議の", "最中は", "カメラが", "使用禁止です。"], s: 1, h: hN, e: eSaichuu + " ★ là 最中は." },
          { p: "Đúng giữa lúc đang nấu, chuông reo.", t: ["料理を", "している", "最中に", "ベルが鳴った。"], s: 2, h: hV, e: eSaichuu + " ★ là 最中に." },
          { p: "Đừng làm ồn giữa giờ kiểm tra.", t: ["テストの", "最中に", "騒がないで", "ください。"], s: 1, h: hN, e: eSaichuu + " ★ là 最中に." },
        ],
      },
    ),

    P(
      "l02-g02",
      {
        meaning: "Trong lúc còn… / tranh thủ khi còn…; trong khi…",
        structures: ["Vる／Vない ＋ うちに", "Aい／Nの ＋ うちに"],
        explanation:
          "Diễn tả làm việc gì trong khoảng thời gian còn đang ở trạng thái đó, hoặc tranh thủ trước khi trạng thái thay đổi.",
        usage: "Khuyên tranh thủ (còn trẻ, còn nóng…); hoặc hành động song song trong khoảng thời gian.",
        cautions: [
          "Phân biệt với 間に: うちに hay nhấn 'trước khi thay đổi / tranh thủ'.",
          "Với nghĩa tranh thủ, thường đi với trạng thái sẽ mất đi.",
        ],
        contrast:
          "うちに (tranh thủ) khác 最中 (đúng giữa lúc). Cũng khác までに (hạn chót hoàn thành).",
        examples: [
          {
            ja: "若いうちにいろいろな経験をしておきたい。",
            reading: "わかいうちにいろいろなけいけんをしておきたい。",
            vi: "Tôi muốn trải nghiệm nhiều thứ khi còn trẻ.",
            ruby: ruby([["若", "わか"], ["いうちに"], ["いろいろな"], ["経験", "けいけん"], ["をしておきたい。"]]),
          },
          {
            ja: "忘れないうちにメモしておこう。",
            reading: "わすれないうちにめもしておこう。",
            vi: "Hãy ghi chú trước khi quên.",
            ruby: ruby([["忘", "わす"], ["れないうちに"], ["メモしておこう。"]]),
          },
          {
            ja: "暖かくないうちにコートを着なさい。",
            reading: "あたたかくないうちにこーとをきなさい。",
            vi: "Hãy mặc áo khoác trước khi trời chưa ấm (còn lạnh).",
            ruby: ruby([["暖", "あたた"], ["かくないうちに"], ["コートを"], ["着", "き"], ["なさい。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng うちに để nói tranh thủ / trong lúc còn trạng thái đó. Giữ đúng điều kiện thời gian và hành động.";
        const h = "Vる／Vない／Aい ＋ うちに";
        return {
          viJa: [
            { p: "Hãy ăn khi còn nóng.", a: "熱いうちに食べてください。", h, e },
            { p: "Tôi muốn đi du lịch khi còn độc thân.", a: "独身のうちに旅行しておきたい。", h: "Nの ＋ うちに", e },
            { p: "Gọi điện trước khi anh ấy về nhà.", a: "彼が帰らないうちに電話しよう。", h, e },
            { p: "Hãy quyết định khi còn thời gian.", a: "時間があるうちに決めましょう。", h, e },
            { p: "Tôi học thêm khi còn nhớ bài.", a: "覚えているうちに復習する。", h, e },
            { p: "Ra ngoài chơi khi trời còn sáng.", a: "明るいうちに外で遊ぼう。", h, e },
            { p: "Hãy gửi thư trước khi quên địa chỉ.", a: "住所を忘れないうちに手紙を出そう。", h, e },
            { p: "Tôi muốn đọc nhiều sách khi còn là sinh viên.", a: "学生のうちに本をたくさん読みたい。", h: "Nの ＋ うちに", e },
            { p: "Hãy sửa lỗi khi còn sớm.", a: "早いうちに間違いを直してください。", h, e },
            { p: "Tranh thủ lúc mưa chưa to, hãy về nhà.", a: "雨がひどくならないうちに帰りましょう。", h, e },
          ],
          jaVi: [
            { p: "冷めないうちにどうぞ召し上がってください。", a: "Xin mời dùng khi còn chưa nguội.", h, e },
            { p: "元気なうちに運動を続けたい。", a: "Tôi muốn tiếp tục tập thể dục khi còn khỏe.", h, e },
            { p: "暗くならないうちに買い物を済ませよう。", a: "Hãy mua sắm xong trước khi trời tối.", h, e },
            { p: "子供のうちにピアノを習わせた。", a: "Tôi đã cho học piano khi còn nhỏ.", h: "Nの ＋ うちに", e },
            { p: "知らないうちに春になっていた。", a: "Không hay biết thì đã sang xuân.", h, e },
            { p: "働けるうちに貯金しておこう。", a: "Hãy tiết kiệm khi còn làm việc được.", h, e },
            { p: "忘れないうちに礼状を書きます。", a: "Tôi sẽ viết thư cảm ơn trước khi quên.", h, e },
            { p: "若いうちにもっと勉強すればよかった。", a: "Giá như tôi học nhiều hơn khi còn trẻ.", h, e },
            { p: "電車が来ないうちに切符を買おう。", a: "Hãy mua vé trước khi tàu đến.", h, e },
            { p: "暇なうちに部屋を掃除した。", a: "Tôi đã dọn phòng lúc còn rảnh.", h, e },
          ],
          order: [
            { p: "Hãy uống trà khi còn nóng.", t: ["熱い", "うちに", "お茶を", "飲んでください。"], s: 1, h, e: e + " ★ là うちに." },
            { p: "Ghi lại trước khi quên tên.", t: ["名前を", "忘れない", "うちに", "書き留めておこう。"], s: 2, h, e: e + " ★ là うちに." },
            { p: "Du lịch khi còn trẻ.", t: ["若い", "うちに", "世界を", "見ておきたい。"], s: 1, h, e: e + " ★ là うちに." },
            { p: "Về trước khi mưa to hơn.", t: ["雨が", "ひどくならない", "うちに", "帰りたい。"], s: 2, h, e: e + " ★ là うちに." },
            { p: "Đọc sách lúc còn rảnh.", t: ["暇な", "うちに", "この本を", "読んでおこう。"], s: 1, h, e: e + " ★ là うちに." },
            { p: "Tập nói khi còn nhớ từ.", t: ["単語を", "覚えている", "うちに", "声に出そう。"], s: 2, h, e: e + " ★ là うちに." },
            { p: "Gửi mail trước khi hết hạn.", t: ["期限が", "切れる", "うちに", "メールを送る。"], s: 2, h, e: e + " ★ là うちに." },
            { p: "Học khi còn là học sinh.", t: ["生徒の", "うちに", "基礎を", "固めておきたい。"], s: 1, h: "Nの ＋ うちに", e: e + " ★ là うちに." },
            { p: "Ra ngoài khi trời còn mát.", t: ["涼しい", "うちに", "散歩に", "出かけよう。"], s: 1, h, e: e + " ★ là うちに." },
            { p: "Quyết định trước khi muộn.", t: ["遅く", "ならない", "うちに", "結論を出そう。"], s: 2, h, e: e + " ★ là うちに." },
          ],
        };
      })(),
    ),

    P(
      "l02-g03",
      {
        meaning: "Càng lúc càng…; chỉ toàn… (xu hướng một chiều)",
        structures: ["Vる ＋ ばかりだ", "Vる ＋ 一方だ"],
        explanation:
          "ばかりだ và 一方だ đều diễn tả xu hướng tiếp tục theo một hướng (thường tiêu cực hoặc thay đổi rõ). 一方だ cũng dùng trong văn viết/tin tức.",
        usage: "Mô tả tình hình xấu đi / tăng giảm một chiều; báo cáo xu hướng.",
        cautions: [
          "Không nhầm với たばかり (vừa mới làm xong).",
          "一方で (mặt khác) là nghĩa khác — không thuộc nhóm này.",
        ],
        contrast:
          "〜ばかりだ／一方だ = xu hướng một chiều. Khác つつある (đang trong quá trình chuyển biến).",
        examples: [
          {
            ja: "物価は上がる一方だ。",
            reading: "ぶっかはあがるいっぽうだ。",
            vi: "Giá cả chỉ toàn tăng.",
            ruby: ruby([["物価", "ぶっか"], ["は"], ["上", "あ"], ["がる"], ["一方", "いっぽう"], ["だ。"]]),
          },
          {
            ja: "不満の声は増えるばかりだ。",
            reading: "ふまんのこえはふえるばかりだ。",
            vi: "Tiếng phàn nàn chỉ ngày càng nhiều.",
            ruby: ruby([
              ["不満", "ふまん"], ["の"], ["声", "こえ"], ["は"],
              ["増", "ふ"], ["えるばかりだ。"],
            ]),
          },
          {
            ja: "患者の容体は悪化する一方だった。",
            reading: "かんじゃのようたいはあっかするいっぽうだった。",
            vi: "Tình trạng bệnh nhân chỉ ngày càng xấu.",
            ruby: ruby([
              ["患者", "かんじゃ"], ["の"], ["容体", "ようたい"], ["は"],
              ["悪化", "あっか"], ["する"], ["一方", "いっぽう"], ["だった。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng ばかりだ／一方だ để nói xu hướng một chiều (càng lúc càng…). Giữ đúng hướng thay đổi.";
        const h = "Vる ＋ ばかりだ／一方だ";
        return {
          viJa: [
            { p: "Chi phí chỉ ngày càng tăng.", a: "費用は増える一方だ。", h, e },
            { p: "Số học viên chỉ toàn giảm.", a: "受講者は減るばかりだ。", h, e },
            { p: "Ô nhiễm không khí ngày càng nghiêm trọng.", a: "大気汚染は深刻になる一方だ。", h, e },
            { p: "Công việc của tôi chỉ càng thêm nhiều.", a: "私の仕事は増えるばかりだ。", h, e },
            { p: "Khoảng cách giàu nghèo ngày càng lớn.", a: "貧富の差は広がる一方だ。", h, e },
            { p: "Máy tính chỉ càng chậm hơn.", a: "パソコンは遅くなるばかりだ。", h, e },
            { p: "Nhu cầu nhà ở chỉ toàn tăng.", a: "住宅需要は高まる一方だ。", h, e },
            { p: "Tâm trạng anh ấy chỉ càng xấu.", a: "彼の機嫌は悪くなるばかりだ。", h, e },
            { p: "Lượng khách du lịch ngày càng tăng.", a: "観光客の数は増える一方だ。", h, e },
            { p: "Nợ công chỉ ngày càng phình to.", a: "借金は膨らむばかりだ。", h, e },
          ],
          jaVi: [
            { p: "失業者は増える一方だ。", a: "Số người thất nghiệp chỉ ngày càng tăng.", h, e },
            { p: "彼の成績は下がるばかりだ。", a: "Thành tích của anh ấy chỉ càng giảm.", h, e },
            { p: "円安は進む一方だ。", a: "Yên mất giá chỉ càng tiến triển.", h, e },
            { p: "待ち時間は長くなるばかりだ。", a: "Thời gian chờ chỉ càng dài.", h, e },
            { p: "高齢化は進む一方である。", a: "Già hóa dân số chỉ ngày càng tiến triển.", h, e },
            { p: "彼への不信は深まるばかりだ。", a: "Sự bất tín với anh ấy chỉ càng sâu.", h, e },
            { p: "売上げは落ちる一方だ。", a: "Doanh số chỉ toàn giảm.", h, e },
            { p: "騒音はひどくなるばかりだ。", a: "Tiếng ồn chỉ càng tệ hơn.", h, e },
            { p: "要求は厳しくなる一方だ。", a: "Yêu cầu chỉ ngày càng khắt khe.", h, e },
            { p: "彼の体調は悪化するばかりだった。", a: "Sức khỏe anh ấy chỉ càng xấu đi.", h, e },
          ],
          order: [
            { p: "Giá nhà chỉ ngày càng cao.", t: ["住宅価格は", "上がる", "一方", "だ。"], s: 2, h, e: e + " ★ là 一方." },
            { p: "Nợ chỉ càng tăng.", t: ["借金は", "増える", "ばかり", "だ。"], s: 2, h, e: e + " ★ là ばかり." },
            { p: "Ô nhiễm ngày càng nặng.", t: ["汚染は", "深刻に", "なる一方", "だ。"], s: 2, h, e: e + " ★ là なる一方." },
            { p: "Số lỗi chỉ càng nhiều.", t: ["ミスは", "増える", "ばかり", "だ。"], s: 2, h, e: e + " ★ là ばかり." },
            { p: "Khoảng cách chỉ càng rộng.", t: ["格差は", "広がる", "一方", "だ。"], s: 2, h, e: e + " ★ là 一方." },
            { p: "Áp lực công việc càng lớn.", t: ["仕事の圧は", "強まる", "一方", "だ。"], s: 2, h, e: e + " ★ là 一方." },
            { p: "Lượng rác chỉ càng tăng.", t: ["ゴミの量は", "増える", "ばかり", "だ。"], s: 2, h, e: e + " ★ là ばかり." },
            { p: "Chi phí y tế ngày càng cao.", t: ["医療費は", "上がる", "一方", "だ。"], s: 2, h, e: e + " ★ là 一方." },
            { p: "Sự bất an chỉ càng lớn.", t: ["不安は", "大きくなる", "ばかり", "だ。"], s: 2, h, e: e + " ★ là ばかり." },
            { p: "Già hóa dân số chỉ tiến triển.", t: ["高齢化は", "進む", "一方", "だ。"], s: 2, h, e: e + " ★ là 一方." },
          ],
        };
      })(),
    ),

    P(
      "l02-g04",
      {
        meaning: "Sắp / đang định làm; đang trên đà sắp xảy ra",
        structures: ["V（よ）うとしている", "V（よ）うとした"],
        explanation:
          "Diễn tả chủ thể sắp thực hiện hành động, hoặc sự việc sắp xảy ra. ようとした thường là 'định làm thì…'.",
        usage: "Kể chuyện, tường thuật khoảnh khắc sắp làm / sắp xảy ra.",
        cautions: [
          "Khác ようとする (ý chí/cố gắng) ở sắc thái; bài này tập trung 'sắp / đang định'.",
          "Với sự vật vô tri vẫn dùng được (雨が降ろうとしている).",
        ],
        contrast:
          "（よ）うとしている ≈ sắp xảy ra / đang định. Khác つつある (đang dần chuyển biến).",
        examples: [
          {
            ja: "電車が出発しようとしている。",
            reading: "でんしゃがしゅっぱつしようとしている。",
            vi: "Tàu đang sắp khởi hành.",
            ruby: ruby([["電車", "でんしゃ"], ["が"], ["出発", "しゅっぱつ"], ["しようとしている。"]]),
          },
          {
            ja: "出かけようとしたとき、雨が降り始めた。",
            reading: "でかけようとしたとき、あめがふりはじめた。",
            vi: "Đúng lúc tôi định ra ngoài thì trời bắt đầu mưa.",
            ruby: ruby([["出", "で"], ["かけようとしたとき、"], ["雨", "あめ"], ["が"], ["降", "ふ"], ["り始めた。"]]),
          },
          {
            ja: "夜が明けようとしている。",
            reading: "よるがあけようとしている。",
            vi: "Đêm đang sắp tàn (trời sắp sáng).",
            ruby: ruby([["夜", "よる"], ["が"], ["明", "あ"], ["けようとしている。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng （よ）うとしている／した để nói sắp làm hoặc định làm thì…. Giữ đúng khoảnh khắc hành động.";
        const h = "V（よ）うとしている／した";
        return {
          viJa: [
            { p: "Máy bay sắp cất cánh.", a: "飛行機が離陸しようとしている。", h, e },
            { p: "Tôi định gọi thì anh ấy đến.", a: "電話をかけようとしたら、彼が来た。", h, e },
            { p: "Hoa anh đào sắp nở.", a: "桜が咲こうとしている。", h, e },
            { p: "Cô ấy sắp khóc.", a: "彼女は泣こうとしている。", h, e },
            { p: "Tôi định ngồi thì chuông reo.", a: "座ろうとしたとき、ベルが鳴った。", h, e },
            { p: "Mặt trời sắp lặn.", a: "日が沈もうとしている。", h, e },
            { p: "Anh ấy sắp nói điều quan trọng.", a: "彼は重要なことを言おうとしている。", h, e },
            { p: "Tôi định ra ngoài thì có khách.", a: "出かけようとしたら、客が来た。", h, e },
            { p: "Cửa sổ sắp đóng lại.", a: "窓が閉まろうとしている。", h, e },
            { p: "Đứa trẻ sắp ngủ.", a: "子供が眠ろうとしている。", h, e },
          ],
          jaVi: [
            { p: "バスが出ようとしている。", a: "Xe buýt sắp khởi hành.", h, e },
            { p: "説明しようとしたが、言葉が出なかった。", a: "Tôi định giải thích nhưng không nói nên lời.", h, e },
            { p: "雨がやもうとしている。", a: "Mưa sắp tạnh.", h, e },
            { p: "彼は部屋を出ようとしている。", a: "Anh ấy sắp ra khỏi phòng.", h, e },
            { p: "寝ようとしたとき、地震があった。", a: "Đúng lúc tôi định ngủ thì có động đất.", h, e },
            { p: "新しい時代が始まろうとしている。", a: "Một thời đại mới sắp bắt đầu.", h, e },
            { p: "彼女は真実を話そうとしている。", a: "Cô ấy sắp nói sự thật.", h, e },
            { p: "ドアを開けようとしたら、鍵がかかっていた。", a: "Tôi định mở cửa thì thấy đang khóa.", h, e },
            { p: "雪が積もろうとしている。", a: "Tuyết sắp phủ dày.", h, e },
            { p: "会議が終わろうとしている。", a: "Cuộc họp sắp kết thúc.", h, e },
          ],
          order: [
            { p: "Tàu sắp đến ga.", t: ["電車が", "駅に", "着こうと", "している。"], s: 2, h, e: e + " ★ chứa うと." },
            { p: "Tôi định uống nước thì hết.", t: ["水を", "飲もうと", "したら、", "なくなっていた。"], s: 1, h, e: e + " ★ là 飲もうと." },
            { p: "Hoa sắp héo.", t: ["花が", "いまにも", "枯れようと", "している。"], s: 2, h, e: e + " ★ là 枯れようと." },
            { p: "Anh ấy sắp đứng dậy.", t: ["彼は", "席を", "立とうと", "している。"], s: 2, h, e: e + " ★ là 立とうと." },
            { p: "Tôi định gửi thì quên file.", t: ["送ろうと", "したら、", "ファイルを", "忘れていた。"], s: 0, h, e: e + " ★ là 送ろうと." },
            { p: "Trời sắp tối.", t: ["空が", "暗く", "なろうと", "している。"], s: 2, h, e: e + " ★ là なろうと." },
            { p: "Cô ấy sắp trả lời.", t: ["彼女は", "すぐに", "答えようと", "している。"], s: 2, h, e: e + " ★ là 答えようと." },
            { p: "Tôi định vào thì cửa đóng.", t: ["入ろうと", "したら、", "ドアが", "閉まった。"], s: 0, h, e: e + " ★ là 入ろうと." },
            { p: "Lửa sắp tắt.", t: ["火が", "消えようと", "している", "らしい。"], s: 1, h, e: e + " ★ là 消えようと." },
            { p: "Họ sắp ký hợp đồng.", t: ["彼らは", "契約に", "サインしようと", "している。"], s: 2, h, e: e + " ★ là サインしようと." },
          ],
        };
      })(),
    ),

    P(
      "l02-g05",
      {
        meaning: "Đang dần…; đang trong quá trình chuyển biến",
        structures: ["Vます ＋ つつある"],
        explanation:
          "Diễn tả sự thay đổi đang tiến triển theo hướng nào đó. Thường dùng văn viết, tin tức, báo cáo.",
        usage: "Mô tả xu hướng xã hội, tình hình đang chuyển biến.",
        cautions: [
          "Không dùng cho hành động chủ động ngắn (như đang ăn).",
          "Khác ている: つつある nhấn 'đang chuyển biến'.",
        ],
        contrast:
          "つつある = đang dần thay đổi. Khác （よ）うとしている (sắp xảy ra) và ばかりだ (chỉ toàn theo một hướng, thường tiêu cực).",
        examples: [
          {
            ja: "景気は回復しつつある。",
            reading: "けいきはかいふくしつつある。",
            vi: "Kinh tế đang dần phục hồi.",
            ruby: ruby([["景気", "けいき"], ["は"], ["回復", "かいふく"], ["しつつある。"]]),
          },
          {
            ja: "問題は解決しつつある。",
            reading: "もんだいはかいけつしつつある。",
            vi: "Vấn đề đang dần được giải quyết.",
            ruby: ruby([["問題", "もんだい"], ["は"], ["解決", "かいけつ"], ["しつつある。"]]),
          },
          {
            ja: "伝統文化が失われつつある。",
            reading: "でんとうぶんかがうしなわれつつある。",
            vi: "Văn hóa truyền thống đang dần mất đi.",
            ruby: ruby([["伝統", "でんとう"], ["文化", "ぶんか"], ["が"], ["失", "うしな"], ["われつつある。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng つつある để nói đang dần chuyển biến. Giữ đúng hướng thay đổi; phù hợp văn viết/tin tức.";
        const h = "Vます ＋ つつある";
        return {
          viJa: [
            { p: "Tình hình đang dần cải thiện.", a: "状況は改善しつつある。", h, e },
            { p: "Rừng đang dần biến mất.", a: "森は消えつつある。", h, e },
            { p: "Nhận thức về môi trường đang dần cao.", a: "環境への意識は高まりつつある。", h, e },
            { p: "Xung đột đang dần lắng dịu.", a: "対立は収まりつつある。", h, e },
            { p: "Công nghệ mới đang dần phổ biến.", a: "新しい技術は広まりつつある。", h, e },
            { p: "Số ca bệnh đang dần giảm.", a: "患者数は減少しつつある。", h, e },
            { p: "Thành phố đang dần thay đổi.", a: "街は変わりつつある。", h, e },
            { p: "Niềm tin đang dần được khôi phục.", a: "信頼は回復しつつある。", h, e },
            { p: "Loài này đang dần tuyệt chủng.", a: "この種は絶滅しつつある。", h, e },
            { p: "Quan hệ hai nước đang dần tốt lên.", a: "両国の関係は良くなりつつある。", h, e },
          ],
          jaVi: [
            { p: "社会は多様化しつつある。", a: "Xã hội đang dần đa dạng hóa.", h, e },
            { p: "彼の病状は快方に向かいつつある。", a: "Bệnh tình anh ấy đang dần khá hơn.", h, e },
            { p: "古い習慣は廃れつつある。", a: "Tập quán cũ đang dần lỗi thời.", h, e },
            { p: "議論は決着しつつある。", a: "Cuộc thảo luận đang dần ngã ngũ.", h, e },
            { p: "気候変動の影響が現れつつある。", a: "Ảnh hưởng biến đổi khí hậu đang dần lộ rõ.", h, e },
            { p: "若者の価値観は変化しつつある。", a: "Giá trị quan của giới trẻ đang dần thay đổi.", h, e },
            { p: "緊張は和らぎつつある。", a: "Căng thẳng đang dần dịu lại.", h, e },
            { p: "新しい制度が定着しつつある。", a: "Chế độ mới đang dần ổn định.", h, e },
            { p: "格差は縮小しつつある。", a: "Khoảng cách đang dần thu hẹp.", h, e },
            { p: "希望が見えつつある。", a: "Hy vọng đang dần lộ ra.", h, e },
          ],
          order: [
            { p: "Kinh tế đang dần phục hồi.", t: ["景気は", "少しずつ", "回復し", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Rừng đang dần mất.", t: ["森林は", "急速に", "失われ", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Nhận thức đang dần cao.", t: ["意識は", "着実に", "高まり", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Vấn đề đang dần giải quyết.", t: ["問題は", "徐々に", "解決し", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Văn hóa đang dần mai một.", t: ["文化は", "静かに", "消え", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Quan hệ đang dần cải thiện.", t: ["関係は", "確実に", "改善し", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Số liệu đang dần tăng.", t: ["数値は", "年々", "上昇し", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Thành phố đang dần mở rộng.", t: ["都市は", "郊外へ", "広がり", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Niềm tin đang dần trở lại.", t: ["信頼は", "ゆっくりと", "戻り", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
            { p: "Căng thẳng đang dần giảm.", t: ["緊張は", "次第に", "低下し", "つつある。"], s: 3, h, e: e + " ★ là つつある." },
          ],
        };
      })(),
    ),

    P(
      "l02-g06",
      {
        meaning: "Vừa… vừa…; trong khi… (văn viết; gần ながら)",
        structures: ["Vます ＋ つつ"],
        explanation:
          "Nối hai hành động đồng thời hoặc hành động nền. Văn viết trang trọng hơn ながら. Không nhầm với つつある.",
        usage: "Văn viết, phát biểu; mô tả vừa làm A vừa làm B, hoặc dù biết vẫn… (khi có sắc thái đối lập nhẹ).",
        cautions: [
          "つつ ≠ つつある (thiếu ある thì không có nghĩa 'đang dần').",
          "Chủ ngữ thường cùng một người cho hai hành động.",
        ],
        contrast:
          "つつ ≈ ながら (đồng thời). つつある = đang chuyển biến — khác nhóm.",
        examples: [
          {
            ja: "彼は働きつつ、夜学に通っている。",
            reading: "かれははたらきつつ、やがくにかよっている。",
            vi: "Anh ấy vừa làm việc vừa đi học buổi tối.",
            ruby: ruby([["彼", "かれ"], ["は"], ["働", "はたら"], ["きつつ、"], ["夜学", "やがく"], ["に"], ["通", "かよ"], ["っている。"]]),
          },
          {
            ja: "申し訳ないと思いつつ、断った。",
            reading: "もうしわけないと思いつつ、ことわった。",
            vi: "Trong khi cảm thấy xin lỗi, tôi vẫn từ chối.",
            ruby: ruby([["申", "もう"], ["し"], ["訳", "わけ"], ["ないと思いつつ、"], ["断", "ことわ"], ["った。"]]),
          },
          {
            ja: "音楽を聴きつつ作業を進めた。",
            reading: "おんがくをききつつさぎょうをすすめた。",
            vi: "Tôi vừa nghe nhạc vừa tiến hành công việc.",
            ruby: ruby([["音楽", "おんがく"], ["を"], ["聴", "き"], ["きつつ"], ["作業", "さぎょう"], ["を"], ["進", "すす"], ["めた。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng つつ (không có ある) để nối hai hành động đồng thời / nền. Giữ đúng chủ ngữ và cặp hành động.";
        const h = "Vます ＋ つつ";
        return {
          viJa: [
            { p: "Tôi vừa đi vừa suy nghĩ.", a: "歩きつつ考えた。", h, e },
            { p: "Anh ấy vừa cười vừa trả lời.", a: "彼は笑いつつ答えた。", h, e },
            { p: "Tôi vừa tiếc vừa chấp nhận.", a: "残念に思いつつ受け入れた。", h, e },
            { p: "Cô ấy vừa làm việc vừa nuôi con.", a: "彼女は働きつつ子供を育てた。", h, e },
            { p: "Tôi vừa đọc báo vừa uống cà phê.", a: "新聞を読みつつコーヒーを飲んだ。", h, e },
            { p: "Anh ấy vừa lo vừa chờ kết quả.", a: "彼は心配しつつ結果を待った。", h, e },
            { p: "Tôi vừa nghe giải thích vừa ghi chú.", a: "説明を聞きつつメモを取った。", h, e },
            { p: "Họ vừa thảo luận vừa sửa kế hoạch.", a: "彼らは話し合いつつ計画を修正した。", h, e },
            { p: "Tôi vừa biết lỗi vừa xin lỗi.", a: "過ちを知りつつ謝罪した。", h, e },
            { p: "Cô ấy vừa nhìn đồng hồ vừa nói.", a: "彼女は時計を見つつ話した。", h, e },
          ],
          jaVi: [
            { p: "彼はタバコを吸いつつ話した。", a: "Anh ấy vừa hút thuốc vừa nói chuyện.", h, e },
            { p: "危険だと知りつつ登山した。", a: "Dù biết nguy hiểm vẫn leo núi.", h, e },
            { p: "涙を流しつつ手紙を読んだ。", a: "Tôi vừa khóc vừa đọc thư.", h, e },
            { p: "音楽を楽しみつつ料理した。", a: "Tôi vừa thưởng thức nhạc vừa nấu ăn.", h, e },
            { p: "彼は躊躇いつつも同意した。", a: "Anh ấy vừa do dự vừa đồng ý.", h, e },
            { p: "景色を眺めつつ歩いた。", a: "Tôi vừa ngắm cảnh vừa đi bộ.", h, e },
            { p: "資料を確認しつつ発表した。", a: "Tôi vừa kiểm tra tài liệu vừa thuyết trình.", h, e },
            { p: "彼女は悩みつつ決断した。", a: "Cô ấy vừa lo lắng vừa quyết định.", h, e },
            { p: "子どもを見守しつつ仕事をした。", a: "Tôi vừa trông con vừa làm việc.", h, e },
            { p: "彼は微笑みつつ部屋を出た。", a: "Anh ấy vừa mỉm cười vừa ra khỏi phòng.", h, e },
          ],
          order: [
            { p: "Vừa đi vừa nói chuyện.", t: ["歩き", "つつ", "話を", "続けた。"], s: 1, h, e: e + " ★ là つつ." },
            { p: "Vừa làm vừa học.", t: ["働き", "つつ", "資格を", "取った。"], s: 1, h, e: e + " ★ là つつ." },
            { p: "Vừa tiếc vừa từ chối.", t: ["残念に", "思い", "つつ", "断った。"], s: 2, h, e: e + " ★ là つつ." },
            { p: "Vừa nghe vừa ghi.", t: ["聞き", "つつ", "要点を", "書き留めた。"], s: 1, h, e: e + " ★ là つつ." },
            { p: "Vừa cười vừa giải thích.", t: ["笑い", "つつ", "事情を", "説明した。"], s: 1, h, e: e + " ★ là つつ." },
            { p: "Vừa lo vừa chờ.", t: ["心配し", "つつ", "連絡を", "待った。"], s: 1, h, e: e + " ★ là つつ." },
            { p: "Vừa đọc vừa dịch.", t: ["原文を", "読み", "つつ", "訳した。"], s: 2, h, e: e + " ★ là つつ." },
            { p: "Vừa nhìn bản đồ vừa đi.", t: ["地図を", "見", "つつ", "進んだ。"], s: 2, h, e: e + " ★ là つつ." },
            { p: "Vừa biết vẫn làm.", t: ["悪いと", "知り", "つつ", "実行した。"], s: 2, h, e: e + " ★ là つつ." },
            { p: "Vừa uống trà vừa nghỉ.", t: ["お茶を", "飲み", "つつ", "休憩した。"], s: 2, h, e: e + " ★ là つつ." },
          ],
        };
      })(),
    ),
  ];
}
