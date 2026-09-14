export const kanaGroups = [
  {
    name: "Âm cơ bản",
    hira: "あいうえお かきくけこ さしすせそ たちつてと なにぬねの はひふへほ まみむめも やゆよ らりるれろ わをん",
    romaji:
      "a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n",
  },
  {
    name: "Âm đục & bán đục",
    hira: "がぎぐげご ざじずぜぞ だぢづでど ばびぶべぼ ぱぴぷぺぽ",
    romaji:
      "ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po",
  },
  {
    name: "Âm ghép",
    hira: "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ",
    romaji:
      "kya kyu kyo sha shu sho cha chu cho nya nyu nyo hya hyu hyo mya myu myo rya ryu ryo gya gyu gyo ja ju jo bya byu byo pya pyu pyo",
  },
];
export function kanaRows(group: number, katakana = false) {
  const g = kanaGroups[group];
  const chars =
    group === 2 ? g.hira.split(" ") : [...g.hira.replaceAll(" ", "")];
  return chars.map((hira, i) => ({
    term: katakana
      ? [...hira]
          .map((c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
          .join("")
      : hira,
    meaning: g.romaji.split(" ")[i],
    reading: "",
    example: "",
  }));
}
