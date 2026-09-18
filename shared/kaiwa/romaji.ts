/**
 * Hepburn romaji from kana readings (not from raw kanji).
 * Documented exceptions: particles は/へ/を → wa/e/o; ん assimilation; っ gemination.
 */

const BASIC: Record<string, string> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
  ゃ: "ya",
  ゅ: "yu",
  ょ: "yo",
  っ: "",
  ー: "",
};

function katakanaToHiragana(input: string): string {
  return [...input]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) return String.fromCharCode(code - 0x60);
      return ch;
    })
    .join("");
}

/** Particle surface overrides when the token is a known particle. */
export function particleRomaji(surface: string): string | null {
  if (surface === "は") return "wa";
  if (surface === "へ") return "e";
  if (surface === "を") return "o";
  return null;
}

export function readingToRomaji(
  reading: string,
  opts: { surface?: string; isParticle?: boolean } = {},
): string {
  if (opts.isParticle || (opts.surface && particleRomaji(opts.surface))) {
    const p = particleRomaji(opts.surface || reading);
    if (p) return p;
  }
  const kana = katakanaToHiragana(reading.normalize("NFC"));
  let out = "";
  let i = 0;
  while (i < kana.length) {
    const ch = kana[i];
    if (ch === "っ" || ch === "ッ") {
      const nextTwo = kana.slice(i + 1, i + 3);
      const nextOne = kana[i + 1] || "";
      const nextRomaji = BASIC[nextTwo] || BASIC[nextOne] || "";
      const cons = nextRomaji.match(/^[bcdfghjklmnpqrstvwxyz]/i);
      out += cons ? cons[0] : "";
      i += 1;
      continue;
    }
    if (ch === "ん" || ch === "ン") {
      const next = kana[i + 1] || "";
      if (/[ばびぶべぼぱぴぷぺぽまみむめも]/u.test(next)) out += "m";
      else out += "n";
      i += 1;
      continue;
    }
    if (ch === "ー") {
      // prolong previous vowel
      const m = out.match(/[aeiou]$/i);
      if (m) out += m[0];
      i += 1;
      continue;
    }
    const two = kana.slice(i, i + 2);
    if (BASIC[two]) {
      out += BASIC[two];
      i += 2;
      continue;
    }
    if (BASIC[ch]) {
      out += BASIC[ch];
      i += 1;
      continue;
    }
    // pass through latin / punctuation
    out += ch;
    i += 1;
  }
  return out;
}

export type KaiwaRubyToken = {
  surface: string;
  reading?: string;
  romaji?: string;
  manual?: boolean;
};

/** Rebuild romaji from readings; preserve manual romaji overrides. */
export function tokensWithRomaji(tokens: KaiwaRubyToken[]): KaiwaRubyToken[] {
  return tokens.map((t) => {
    if (t.manual && t.romaji) return t;
    const particle = particleRomaji(t.surface);
    const romaji =
      particle ||
      (t.reading ? readingToRomaji(t.reading, { surface: t.surface }) : t.romaji);
    return { ...t, romaji };
  });
}

/** When Japanese text changes, dependent reading layers need review. */
export function markReadingStaleOnJaChange(
  prevJa: string,
  nextJa: string,
  tokens: KaiwaRubyToken[] | undefined,
): { tokens?: KaiwaRubyToken[]; readingStale: boolean } {
  if (prevJa === nextJa) {
    return { tokens, readingStale: false };
  }
  const hasManual = (tokens || []).some((t) => t.manual);
  if (hasManual) {
    return { tokens, readingStale: true };
  }
  return { tokens: undefined, readingStale: true };
}
