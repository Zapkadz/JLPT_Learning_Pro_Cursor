import { ruby } from "./_util.mjs";

export function lesson03Patterns(byId, makePattern) {
  const P = (id, theory, pack) => makePattern(byId(id), theory, pack, 3);

  return [
    P(
      "l03-g01",
      {
        meaning: "Chỉ sau khi… mới…; mãi đến khi… mới nhận ra",
        structures: ["Vて ＋ はじめて"],
        explanation:
          "Nêu rằng chỉ sau khi trải qua A thì mới xảy ra B (thường là nhận thức, hiểu ra, bắt đầu được).",
        usage: "Kể trải nghiệm; nhấn mạnh điều kiện tiên quyết về trải nghiệm.",
        cautions: [
          "Không dùng cho chuỗi hành động đơn thuần 'xong A rồi B' — cần sắc thái 'mới/chỉ khi'.",
          "Thường đi với nhận thức, khả năng, thay đổi nhận thức.",
        ],
        contrast:
          "てはじめて ≠ てから (sau khi). てはじめて nhấn 'chỉ nhờ trải qua mới…'.",
        examples: [
          {
            ja: "病気になってはじめて健康のありがたさがわかった。",
            reading: "びょうきになってはじめてけんこうのありがたさがわかった。",
            vi: "Chỉ khi bị bệnh tôi mới hiểu giá trị của sức khỏe.",
            ruby: ruby([
              ["病気", "びょうき"], ["になってはじめて"], ["健康", "けんこう"],
              ["のありがたさがわかった。"],
            ]),
          },
          {
            ja: "日本に来てはじめて刺身を食べた。",
            reading: "にほんにきてはじめてさしみをたべた。",
            vi: "Chỉ sau khi đến Nhật tôi mới ăn sashimi lần đầu.",
            ruby: ruby([
              ["日本", "にほん"], ["に"], ["来", "き"], ["てはじめて"],
              ["刺身", "さしみ"], ["を"], ["食", "た"], ["べた。"],
            ]),
          },
          {
            ja: "失敗してはじめて自分の弱点に気づいた。",
            reading: "しっぱいしてはじめてじぶんのじゃくてんにきづいた。",
            vi: "Chỉ sau khi thất bại tôi mới nhận ra điểm yếu của mình.",
            ruby: ruby([
              ["失敗", "しっぱい"], ["してはじめて"], ["自分", "じぶん"],
              ["の"], ["弱点", "じゃくてん"], ["に"], ["気", "き"], ["づいた。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng てはじめて: chỉ sau khi trải qua A mới B. Giữ đúng trải nghiệm và kết quả nhận thức/hành động.";
        const h = "Vて ＋ はじめて";
        return {
          viJa: [
            { p: "Chỉ khi mất việc tôi mới hiểu giá trị công việc.", a: "職を失ってはじめて仕事の大切さがわかった。", h, e },
            { p: "Chỉ sau khi sống một mình tôi mới biết nấu ăn.", a: "一人暮らしをしてはじめて料理ができるようになった。", h, e },
            { p: "Chỉ khi có con tôi mới hiểu công ơn cha mẹ.", a: "親になってはじめて親の恩がわかった。", h, e },
            { p: "Chỉ sau khi đọc sách đó tôi mới quan tâm lịch sử.", a: "その本を読んではじめて歴史に興味を持った。", h, e },
            { p: "Chỉ khi đi nước ngoài tôi mới nhận ra hạn chế tiếng Anh.", a: "海外に行ってはじめて英語力の不足に気づいた。", h, e },
            { p: "Chỉ sau khi thất bại dự án tôi mới học cách lập kế hoạch.", a: "プロジェクトに失敗してはじめて計画の立て方を学んだ。", h, e },
            { p: "Chỉ khi gặp thầy tôi mới thích toán.", a: "先生に出会ってはじめて数学が好きになった。", h, e },
            { p: "Chỉ sau khi nghỉ việc tôi mới có thời gian cho gia đình.", a: "退職してはじめて家族との時間を持てた。", h, e },
            { p: "Chỉ khi bị cảm tôi mới biết nghỉ ngơi quan trọng.", a: "風邪をひいてはじめて休息の大切さがわかった。", h, e },
            { p: "Chỉ sau khi thắng giải tôi mới tự tin.", a: "大会に優勝してはじめて自信がついた。", h, e },
          ],
          jaVi: [
            { p: "実際にやってみてはじめて難しさがわかった。", a: "Chỉ khi thử làm thật tôi mới hiểu độ khó.", h, e },
            { p: "留学してはじめて自立できた。", a: "Chỉ sau khi du học tôi mới tự lập được.", h, e },
            { p: "事故に遭ってはじめて安全運転を心がけるようになった。", a: "Chỉ khi gặp tai nạn tôi mới chú tâm lái xe an toàn.", h, e },
            { p: "結婚してはじめて責任の重さを感じた。", a: "Chỉ sau khi kết hôn tôi mới cảm nhận trọng trách.", h, e },
            { p: "彼に出会ってはじめて人生が変わった。", a: "Chỉ khi gặp anh ấy cuộc đời tôi mới thay đổi.", h, e },
            { p: "辞めてはじめて会社の良さがわかった。", a: "Chỉ sau khi nghỉ việc tôi mới hiểu điểm tốt của công ty.", h, e },
            { p: "発表してはじめて自分の考えが整理できた。", a: "Chỉ khi thuyết trình tôi mới sắp xếp được suy nghĩ.", h, e },
            { p: "経験してはじめて人の気持ちがわかるようになる。", a: "Chỉ sau khi trải nghiệm mới hiểu cảm xúc người khác.", h, e },
            { p: "試合に出てみてはじめて実力がわかった。", a: "Chỉ khi ra sân thi đấu tôi mới biết thực lực.", h, e },
            { p: "夜勤をしてはじめて昼間の仕事の楽さがわかった。", a: "Chỉ sau khi làm ca đêm tôi mới thấy ca ngày dễ chịu.", h, e },
          ],
          order: [
            { p: "Chỉ khi bị bệnh mới biết ơn sức khỏe.", t: ["病気に", "なって", "はじめて", "健康のありがたさがわかった。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ sau khi đến Nhật mới ăn sushi.", t: ["日本に", "来て", "はじめて", "寿司を食べた。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ khi thất bại mới nhận ra điểm yếu.", t: ["失敗して", "はじめて", "弱点に", "気づいた。"], s: 1, h, e: e + " ★ là はじめて." },
            { p: "Chỉ sau khi sống một mình mới biết tiết kiệm.", t: ["一人で", "暮らして", "はじめて", "節約を覚えた。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ khi có con mới hiểu cha mẹ.", t: ["親に", "なって", "はじめて", "親心がわかった。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ sau khi đọc mới hiểu tác giả.", t: ["作品を", "読んで", "はじめて", "作者の意図がわかった。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ khi đi nước ngoài mới thấy hạn chế.", t: ["海外へ", "行って", "はじめて", "語学力不足に気づいた。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ sau khi nghỉ mới có thời gian.", t: ["仕事を", "辞めて", "はじめて", "自分の時間ができた。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ khi thử mới biết khả năng.", t: ["実際に", "やってみて", "はじめて", "自分の力がわかった。"], s: 2, h, e: e + " ★ là はじめて." },
            { p: "Chỉ sau khi gặp thầy mới thích học.", t: ["良い先生に", "出会って", "はじめて", "勉強が楽しくなった。"], s: 2, h, e: e + " ★ là はじめて." },
          ],
        };
      })(),
    ),

    P(
      "l03-g02",
      {
        meaning: "Sau khi… (trên cơ sở đó); trên phương diện…",
        structures: ["Vた ＋ 上（で）", "Nの ＋ 上（で）"],
        explanation:
          "Một nghĩa: sau khi hoàn tất A thì làm B (thường có chủ đích). Nghĩa khác: trên phương diện / xét về mặt…",
        usage: "Thủ tục, quyết định sau khi xem xét; hoặc nêu góc nhìn đánh giá.",
        cautions: [
          "上で (sau khi) thường đi với Vた／Nの và hành động có chủ ý.",
          "Phân biệt với 上に (thêm vào đó).",
        ],
        contrast:
          "た上で ≈ sau khi (làm nền). Khác てから (trung tính hơn) và 次第 (ngay khi xong thì…).",
        examples: [
          {
            ja: "内容を確認した上で契約してください。",
            reading: "ないようをかくにんしたうえでけいやくしてください。",
            vi: "Sau khi xác nhận nội dung, hãy ký hợp đồng.",
            ruby: ruby([
              ["内容", "ないよう"], ["を"], ["確認", "かくにん"], ["した"],
              ["上", "うえ"], ["で"], ["契約", "けいやく"], ["してください。"],
            ]),
          },
          {
            ja: "計算の上では利益が出る。",
            reading: "けいさんのうえではりえきがでる。",
            vi: "Trên phương diện tính toán thì có lãi.",
            ruby: ruby([
              ["計算", "けいさん"], ["の"], ["上", "うえ"], ["では"],
              ["利益", "りえき"], ["が"], ["出", "で"], ["る。"],
            ]),
          },
          {
            ja: "よく考えた上で返事をします。",
            reading: "よくかんがえたうえでへんじをします。",
            vi: "Sau khi suy nghĩ kỹ tôi sẽ trả lời.",
            ruby: ruby([["よく"], ["考", "かんが"], ["えた"], ["上", "うえ"], ["で"], ["返事", "へんじ"], ["をします。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng 上（で）: sau khi làm nền / trên phương diện. Giữ đúng quan hệ 'nền → hành động' hoặc góc nhìn.";
        const h = "Vた／Nの ＋ 上（で）";
        return {
          viJa: [
            { p: "Sau khi đọc tài liệu, hãy quyết định.", a: "資料を読んだ上で決めてください。", h, e },
            { p: "Sau khi thảo luận với gia đình, tôi sẽ trả lời.", a: "家族と相談した上で返事します。", h, e },
            { p: "Trên phương diện luật pháp thì không sao.", a: "法律の上では問題ない。", h, e },
            { p: "Sau khi kiểm tra sức khỏe, hãy nộp đơn.", a: "健康診断を受けた上で申し込んでください。", h, e },
            { p: "Sau khi so sánh giá, tôi đã mua.", a: "値段を比べた上で購入した。", h, e },
            { p: "Trên lý thuyết thì kế hoạch này ổn.", a: "理論の上ではこの計画は妥当だ。", h, e },
            { p: "Sau khi nghe ý kiến mọi người, hãy sửa.", a: "皆の意見を聞いた上で修正してください。", h, e },
            { p: "Sau khi xem hợp đồng, tôi đã ký.", a: "契約書を見た上でサインした。", h, e },
            { p: "Trên giấy tờ thì anh ấy vẫn là sinh viên.", a: "書類の上では彼はまだ学生だ。", h, e },
            { p: "Sau khi điều tra kỹ, cảnh sát đã bắt giữ.", a: "詳しく調査した上で警察は逮捕した。", h, e },
          ],
          jaVi: [
            { p: "事実を確かめた上で記事を書く。", a: "Sau khi xác minh sự thật mới viết bài.", h, e },
            { p: "データ上では売上げが増えている。", a: "Trên dữ liệu thì doanh số đang tăng.", h, e },
            { p: "十分検討した上で発表します。", a: "Sau khi xem xét kỹ chúng tôi sẽ công bố.", h, e },
            { p: "親の同意を得た上で留学する。", a: "Sau khi được cha mẹ đồng ý mới đi du học.", h, e },
            { p: "計算の上では黒字になるはずだ。", a: "Trên tính toán lẽ ra phải có lãi.", h, e },
            { p: "説明を聞いた上で判断してください。", a: "Sau khi nghe giải thích hãy phán đoán.", h, e },
            { p: "規則の上では禁止されている。", a: "Trên quy định thì bị cấm.", h, e },
            { p: "試着した上で買ったほうがいい。", a: "Nên mua sau khi thử đồ.", h, e },
            { p: "調査の上で判明した事実だ。", a: "Đây là sự thật làm rõ sau điều tra.", h, e },
            { p: "相手の都合を聞いた上で日程を決める。", a: "Sau khi hỏi lịch đối phương mới chốt ngày.", h, e },
          ],
          order: [
            { p: "Sau khi xác nhận, hãy ký.", t: ["内容を", "確認した", "上で", "契約してください。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Sau khi suy nghĩ kỹ sẽ trả lời.", t: ["よく", "考えた", "上で", "返事をします。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Trên tính toán thì có lãi.", t: ["計算の", "上では", "利益が", "出る。"], s: 1, h, e: e + " ★ là 上では." },
            { p: "Sau khi thảo luận hãy quyết.", t: ["家族と", "相談した", "上で", "決めてください。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Sau khi đọc hãy nộp.", t: ["説明書を", "読んだ", "上で", "申し込んでください。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Trên luật thì được phép.", t: ["法律の", "上では", "許可", "されている。"], s: 1, h, e: e + " ★ là 上では." },
            { p: "Sau khi so sánh tôi mua.", t: ["価格を", "比べた", "上で", "購入した。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Sau khi nghe hãy sửa.", t: ["意見を", "聞いた", "上で", "修正する。"], s: 2, h, e: e + " ★ là 上で." },
            { p: "Trên giấy tờ vẫn là hội viên.", t: ["書類の", "上では", "彼は", "会員だ。"], s: 1, h, e: e + " ★ là 上では." },
            { p: "Sau khi điều tra mới bắt.", t: ["詳しく", "調べた", "上で", "逮捕した。"], s: 2, h, e: e + " ★ là 上で." },
          ],
        };
      })(),
    ),

    P(
      "l03-g03",
      {
        meaning: "Ngay khi… thì sẽ… (dự định hành động ngay sau khi)",
        structures: ["Vます ＋ 次第", "N ＋ 次第"],
        explanation:
          "Nói sẽ làm B ngay khi A hoàn tất / xảy ra. Thường dùng lời hứa, thông báo lịch trình.",
        usage: "Email công việc, thông báo: 'xong A sẽ liên lạc ngay'.",
        cautions: [
          "Không nhầm với 次第だ (tùy thuộc) — nghĩa khác, bài khác.",
          "Thường không dùng cho sự việc đã xảy ra trong quá khứ tường thuật tự do.",
        ],
        contrast:
          "次第 ≈ ngay khi xong thì (tương lai/chủ đích). Khác たらすぐ (thân mật hơn) và て以来 (kể từ sau).",
        examples: [
          {
            ja: "着き次第連絡します。",
            reading: "つきしだいれんらくします。",
            vi: "Đến nơi là tôi sẽ liên lạc ngay.",
            ruby: ruby([["着", "つ"], ["き次第"], ["連絡", "れんらく"], ["します。"]]),
          },
          {
            ja: "検査が終わり次第結果をお知らせします。",
            reading: "けんさがおわりしだいけっかをおしらせします。",
            vi: "Ngay khi kiểm tra xong sẽ thông báo kết quả.",
            ruby: ruby([
              ["検査", "けんさ"], ["が"], ["終", "お"], ["わり次第"],
              ["結果", "けっか"], ["を"], ["お"], ["知", "し"], ["らせします。"],
            ]),
          },
          {
            ja: "準備ができ次第出発しましょう。",
            reading: "じゅんびができしだいしゅっぱつしましょう。",
            vi: "Chuẩn bị xong là chúng ta khởi hành ngay.",
            ruby: ruby([["準備", "じゅんび"], ["が"], ["でき次第"], ["出発", "しゅっぱつ"], ["しましょう。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng 次第: ngay khi A xong/xảy ra thì làm B. Giữ đúng quan hệ tức thì và chủ đích.";
        const h = "Vます／N ＋ 次第";
        return {
          viJa: [
            { p: "Về đến nhà là tôi sẽ gọi.", a: "家に着き次第電話します。", h, e },
            { p: "Họp xong sẽ gửi biên bản ngay.", a: "会議が終わり次第議事録を送ります。", h, e },
            { p: "Có tin sẽ báo ngay.", a: "分かり次第お知らせします。", h, e },
            { p: "Máy bay hạ cánh là liên lạc.", a: "飛行機が到着し次第連絡します。", h, e },
            { p: "Sửa xong sẽ giao hàng ngay.", a: "修理が終わり次第配送します。", h, e },
            { p: "Quyết định xong sẽ công bố.", a: "決まり次第発表します。", h, e },
            { p: "Nhận được tài liệu sẽ xác nhận.", a: "資料を受け取り次第確認します。", h, e },
            { p: "Mưa tạnh là chúng ta đi.", a: "雨がやみ次第出発しましょう。", h, e },
            { p: "Xong thủ tục sẽ vào phòng.", a: "手続きが済み次第入室できます。", h, e },
            { p: "Có chỗ trống sẽ liên hệ.", a: "空きが出次第ご連絡します。", h, e },
          ],
          jaVi: [
            { p: "到着次第メールしてください。", a: "Đến nơi là hãy gửi email ngay.", h, e },
            { p: "準備ができ次第始めます。", a: "Chuẩn bị xong là bắt đầu ngay.", h, e },
            { p: "結果が分かり次第報告します。", a: "Có kết quả là tôi sẽ báo cáo ngay.", h, e },
            { p: "仕事が終わり次第合流します。", a: "Tan làm là tôi sẽ hội quân ngay.", h, e },
            { p: "確認でき次第返信します。", a: "Xác nhận được là tôi sẽ trả lời ngay.", h, e },
            { p: "電車が来次第乗りましょう。", a: "Tàu đến là hãy lên ngay.", h, e },
            { p: "印刷が終わり次第配布します。", a: "In xong sẽ phát ngay.", h, e },
            { p: "荷物が届き次第開封してください。", a: "Hàng đến là hãy mở ngay.", h, e },
            { p: "面接が終わり次第結果を出します。", a: "Phỏng vấn xong sẽ có kết quả ngay.", h, e },
            { p: "天候が回復し次第再開します。", a: "Thời tiết ổn định lại sẽ mở lại ngay.", h, e },
          ],
          order: [
            { p: "Đến nơi là liên lạc.", t: ["着き", "次第", "すぐ", "連絡します。"], s: 1, h, e: e + " ★ là 次第." },
            { p: "Họp xong gửi biên bản.", t: ["会議が", "終わり", "次第", "送ります。"], s: 2, h, e: e + " ★ là 次第." },
            { p: "Có tin báo ngay.", t: ["分かり", "次第", "お知らせ", "します。"], s: 1, h, e: e + " ★ là 次第." },
            { p: "Chuẩn bị xong khởi hành.", t: ["準備が", "でき", "次第", "出発しましょう。"], s: 2, h, e: e + " ★ là 次第." },
            { p: "Quyết định xong công bố.", t: ["決まり", "次第", "結果を", "発表します。"], s: 1, h, e: e + " ★ là 次第." },
            { p: "Sửa xong giao hàng.", t: ["修理が", "終わり", "次第", "配送します。"], s: 2, h, e: e + " ★ là 次第." },
            { p: "Mưa tạnh thì đi.", t: ["雨が", "やみ", "次第", "出かけよう。"], s: 2, h, e: e + " ★ là 次第." },
            { p: "Nhận được thì xác nhận.", t: ["受け取り", "次第", "内容を", "確認します。"], s: 1, h, e: e + " ★ là 次第." },
            { p: "Hạ cánh là gọi.", t: ["到着し", "次第", "電話を", "ください。"], s: 1, h, e: e + " ★ là 次第." },
            { p: "Có chỗ trống liên hệ.", t: ["空きが", "出", "次第", "ご連絡します。"], s: 2, h, e: e + " ★ là 次第." },
          ],
        };
      })(),
    ),

    P(
      "l03-g04",
      {
        meaning: "Kể từ khi… đến nay; từ đó đến giờ",
        structures: ["Vて ＋ 以来", "Vて ＋ このかた"],
        explanation:
          "Nêu mốc bắt đầu trong quá khứ và trạng thái/tình hình kéo dài đến hiện tại. てこのかた trang trọng/văn viết hơn.",
        usage: "Kể chuyện đời, thay đổi kể từ một sự kiện.",
        cautions: [
          "Mốc thường là sự kiện cụ thể đã xảy ra.",
          "このかた ít dùng trong hội thoại hàng ngày hơn 以来.",
        ],
        contrast:
          "て以来 ≈ kể từ sau đó đến nay. Khác てから (có thể chỉ chuỗi ngắn) và 次第 (tương lai ngay khi).",
        examples: [
          {
            ja: "卒業して以来、彼に会っていない。",
            reading: "そつぎょうしていらい、かれにあっていない。",
            vi: "Kể từ khi tốt nghiệp, tôi chưa gặp lại anh ấy.",
            ruby: ruby([
              ["卒業", "そつぎょう"], ["して"], ["以来", "いらい"], ["、"],
              ["彼", "かれ"], ["に"], ["会", "あ"], ["っていない。"],
            ]),
          },
          {
            ja: "日本に来てこのかた、毎日日本語を勉強している。",
            reading: "にほんにきてこのかた、まいにちにほんごをべんきょうしている。",
            vi: "Kể từ khi đến Nhật đến nay, tôi học tiếng Nhật mỗi ngày.",
            ruby: ruby([
              ["日本", "にほん"], ["に"], ["来", "き"], ["てこのかた、"],
              ["毎日", "まいにち"], ["日本語", "にほんご"], ["を"], ["勉強", "べんきょう"], ["している。"],
            ]),
          },
          {
            ja: "手術をして以来、体調が良い。",
            reading: "しゅじゅつをしていらい、たいちょうがよい。",
            vi: "Kể từ sau ca phẫu thuật, sức khỏe tôi tốt.",
            ruby: ruby([
              ["手術", "しゅじゅつ"], ["をして"], ["以来", "いらい"], ["、"],
              ["体調", "たいちょう"], ["が"], ["良", "よ"], ["い。"],
            ]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng て以来／てこのかた: kể từ mốc quá khứ đến nay. Giữ đúng mốc và trạng thái kéo dài.";
        const h = "Vて ＋ 以来／このかた";
        return {
          viJa: [
            { p: "Kể từ khi chuyển nhà, tôi chưa về quê.", a: "引っ越して以来、実家に帰っていない。", h, e },
            { p: "Kể từ khi bắt đầu công việc này, tôi bận mỗi ngày.", a: "この仕事を始めて以来、毎日忙しい。", h, e },
            { p: "Kể từ khi gặp cô ấy, cuộc sống tôi thay đổi.", a: "彼女に会って以来、私の生活は変わった。", h, e },
            { p: "Kể từ khi bỏ thuốc, sức khỏe tốt hơn.", a: "禁煙して以来、体調が良くなった。", h, e },
            { p: "Kể từ khi đến công ty này, tôi học được nhiều.", a: "この会社に入ってこのかた、多くを学んだ。", h, e },
            { p: "Kể từ khi động đất, thành phố thay đổi.", a: "地震があって以来、街の様子が変わった。", h, e },
            { p: "Kể từ khi có smartphone, tôi ít đọc sách.", a: "スマホを持って以来、本をあまり読まない。", h, e },
            { p: "Kể từ khi kết hôn, tôi về sớm hơn.", a: "結婚して以来、早く帰るようにしている。", h, e },
            { p: "Kể từ khi mở cửa hàng, cuối tuần luôn đông.", a: "店を開いて以来、週末はいつも混んでいる。", h, e },
            { p: "Kể từ khi học N2, tôi nghe tin tức mỗi ngày.", a: "N2の勉強を始めてこのかた、毎日ニュースを聞いている。", h, e },
          ],
          jaVi: [
            { p: "大学を卒業して以来、彼とは連絡していない。", a: "Kể từ khi tốt nghiệp đại học, tôi không liên lạc với anh ấy.", h, e },
            { p: "日本に来てこのかた、一度も帰国していない。", a: "Kể từ khi đến Nhật đến nay, tôi chưa về nước lần nào.", h, e },
            { p: "病気をして以来、酒を控えている。", a: "Kể từ khi bị bệnh, tôi hạn chế rượu.", h, e },
            { p: "子供が生まれて以来、生活リズムが変わった。", a: "Kể từ khi có con, nhịp sống thay đổi.", h, e },
            { p: "転職して以来、残業が減った。", a: "Kể từ khi chuyển việc, tăng ca giảm.", h, e },
            { p: "事故があって以来、慎重に運転している。", a: "Kể từ sau tai nạn, tôi lái xe thận trọng.", h, e },
            { p: "留学してこのかた、視野が広がった。", a: "Kể từ khi du học đến nay, tầm nhìn mở rộng.", h, e },
            { p: "新しい習慣を始めて以来、朝が楽になった。", a: "Kể từ khi bắt đầu thói quen mới, buổi sáng dễ chịu hơn.", h, e },
            { p: "彼と別れて以来、連絡していない。", a: "Kể từ khi chia tay, tôi không liên lạc.", h, e },
            { p: "この薬を飲み始めて以来、痛みが軽い。", a: "Kể từ khi bắt đầu uống thuốc này, đau nhẹ hơn.", h, e },
          ],
          order: [
            { p: "Kể từ tốt nghiệp chưa gặp.", t: ["卒業して", "以来、", "彼に", "会っていない。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ đến Nhật học mỗi ngày.", t: ["日本に", "来てこのかた、", "毎日", "勉強している。"], s: 1, h, e: e + " ★ là てこのかた." },
            { p: "Kể từ phẫu thuật sức khỏe tốt.", t: ["手術をして", "以来、", "体調が", "良い。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ bỏ thuốc khỏe hơn.", t: ["禁煙して", "以来、", "健康に", "なった。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ chuyển nhà xa công ty.", t: ["引っ越して", "以来、", "通勤が", "長くなった。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ vào công ty học nhiều.", t: ["入社して", "このかた、", "多くを", "学んだ。"], s: 1, h, e: e + " ★ là このかた." },
            { p: "Kể từ có con ít ngủ.", t: ["子供が", "生まれて以来、", "睡眠が", "足りない。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ động đất cảnh quan đổi.", t: ["地震が", "あって以来、", "景色が", "変わった。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ kết hôn về sớm.", t: ["結婚して", "以来、", "早めに", "帰宅する。"], s: 1, h, e: e + " ★ là 以来." },
            { p: "Kể từ mở tiệm cuối tuần đông.", t: ["開店して", "以来、", "週末は", "混む。"], s: 1, h, e: e + " ★ là 以来." },
          ],
        };
      })(),
    ),

    P(
      "l03-g05",
      {
        meaning: "Nếu chưa… thì không thể…; phải… rồi mới…",
        structures: ["Vて ＋ からでないと", "Vて ＋ からでなければ"],
        explanation:
          "Nêu điều kiện tiên quyết phủ định: nếu chưa hoàn thành A thì không thể / không nên B.",
        usage: "Quy tắc, điều kiện bắt buộc trước khi làm bước tiếp.",
        cautions: [
          "Phần sau thường là khả năng phủ định hoặc điều không mong muốn.",
          "からでなければ trang trọng/viết hơn một chút so với からでないと.",
        ],
        contrast:
          "てからでないと ≈ phải A rồi mới B. Khác た上で (sau khi làm nền, khẳng định hơn) và 次第 (ngay khi thì sẽ).",
        examples: [
          {
            ja: "許可をもらってからでないと始められない。",
            reading: "きょかをもらってからでないとはじめられない。",
            vi: "Nếu chưa được phép thì không thể bắt đầu.",
            ruby: ruby([
              ["許可", "きょか"], ["を"], ["もらってからでないと"],
              ["始", "はじ"], ["められない。"],
            ]),
          },
          {
            ja: "資料を読んでからでなければ判断できない。",
            reading: "しりょうをよんでからでなければはんだんできない。",
            vi: "Nếu chưa đọc tài liệu thì không thể phán đoán.",
            ruby: ruby([
              ["資料", "しりょう"], ["を"], ["読", "よ"], ["んでからでなければ"],
              ["判断", "はんだん"], ["できない。"],
            ]),
          },
          {
            ja: "温まってからでないと泳げない。",
            reading: "あたたまってからでないとおよげない。",
            vi: "Nếu chưa khởi động ấm người thì không thể bơi.",
            ruby: ruby([["温", "あたた"], ["まってからでないと"], ["泳", "およ"], ["げない。"]]),
          },
        ],
      },
      (() => {
        const e = "Câu dùng てからでないと／でなければ: chưa A thì không thể B. Giữ đúng điều kiện tiên quyết phủ định.";
        const h = "Vて ＋ からでないと／でなければ";
        return {
          viJa: [
            { p: "Nếu chưa ký hợp đồng thì không thể bắt đầu làm.", a: "契約してからでないと仕事を始められない。", h, e },
            { p: "Nếu chưa hết hạn bảo hành thì không sửa mất phí.", a: "保証期間が切れてからでないと有料修理になる。", h, e },
            { p: "Nếu chưa xác nhận danh tính thì không vào được.", a: "本人確認をしてからでないと入れない。", h, e },
            { p: "Nếu chưa ăn sáng thì không tập được.", a: "朝食を取ってからでないと練習できない。", h, e },
            { p: "Nếu chưa nộp hồ sơ thì không xét tuyển.", a: "書類を提出してからでなければ審査できない。", h, e },
            { p: "Nếu chưa tắt máy thì không mở nắp.", a: "電源を切ってからでないと蓋を開けてはいけない。", h, e },
            { p: "Nếu chưa họp thì không công bố.", a: "会議をしてからでないと発表できない。", h, e },
            { p: "Nếu chưa có vé thì không lên được.", a: "切符を買ってからでないと乗れない。", h, e },
            { p: "Nếu chưa rửa tay thì không nấu.", a: "手を洗ってからでないと料理してはいけない。", h, e },
            { p: "Nếu chưa kiểm tra thì không gửi được.", a: "確認してからでなければ送信できない。", h, e },
          ],
          jaVi: [
            { p: "説明を聞いてからでないとサインできない。", a: "Nếu chưa nghe giải thích thì không thể ký.", h, e },
            { p: "予約してからでないと利用できない。", a: "Nếu chưa đặt trước thì không thể sử dụng.", h, e },
            { p: "練習してからでなければ本番に出られない。", a: "Nếu chưa tập thì không thể ra thi đấu chính.", h, e },
            { p: "料金を払ってからでないと受け取れない。", a: "Nếu chưa trả tiền thì không nhận được.", h, e },
            { p: "許可が出てからでないと公開できない。", a: "Nếu chưa có phép thì không thể công khai.", h, e },
            { p: "冷めてからでないと触れない。", a: "Nếu chưa nguội thì không chạm được.", h, e },
            { p: "登録してからでないとログインできない。", a: "Nếu chưa đăng ký thì không đăng nhập được.", h, e },
            { p: "検査を受けてからでなければ手術できない。", a: "Nếu chưa khám thì không phẫu thuật được.", h, e },
            { p: "親に相談してからでないと決められない。", a: "Nếu chưa hỏi cha mẹ thì không quyết được.", h, e },
            { p: "準備が整ってからでないと始められない。", a: "Nếu chưa sẵn sàng thì không bắt đầu được.", h, e },
          ],
          order: [
            { p: "Chưa được phép thì không bắt đầu.", t: ["許可を", "もらってからでないと", "始め", "られない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa đọc thì không phán đoán.", t: ["資料を", "読んでからでなければ", "判断", "できない。"], s: 1, h, e: e + " ★ là からでなければ." },
            { p: "Chưa ký thì không làm.", t: ["契約してからでないと", "仕事を", "始め", "られない。"], s: 0, h, e: e + " ★ là からでないと." },
            { p: "Chưa xác nhận thì không vào.", t: ["本人確認を", "してからでないと", "入室", "できない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa tắt máy thì không mở.", t: ["電源を", "切ってからでないと", "開けて", "はいけない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa có vé thì không lên.", t: ["切符を", "買ってからでないと", "電車に", "乗れない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa nộp thì không xét.", t: ["提出してからでなければ", "審査を", "開始", "できない。"], s: 0, h, e: e + " ★ là からでなければ." },
            { p: "Chưa họp thì không công bố.", t: ["会議を", "してからでないと", "結果を", "発表できない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa rửa tay thì không nấu.", t: ["手を", "洗ってからでないと", "料理して", "はいけない。"], s: 1, h, e: e + " ★ là からでないと." },
            { p: "Chưa kiểm tra thì không gửi.", t: ["確認してからでなければ", "メールを", "送信", "できない。"], s: 0, h, e: e + " ★ là からでなければ." },
          ],
        };
      })(),
    ),
  ];
}
