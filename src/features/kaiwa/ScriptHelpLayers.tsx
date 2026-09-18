import type { KaiwaRubyToken, KaiwaSegment } from "../../../shared/kaiwa/types";

export type HelpPrefs = { furigana: boolean; romaji: boolean; vi: boolean };

/** JA + optional furigana/romaji/VI with honest empty hints when toggles are on. */
export function ScriptHelpLayers({
  seg,
  prefs,
  compact = false,
}: {
  seg: {
    ja?: string;
    vi?: string;
    tokens?: KaiwaSegment["tokens"];
  };
  prefs: HelpPrefs;
  compact?: boolean;
}) {
  const tokens: Array<Pick<KaiwaRubyToken, "surface" | "reading" | "romaji">> =
    seg.tokens && seg.tokens.length > 0
      ? seg.tokens
      : [{ surface: seg.ja || "(trống)" }];
  const hasReading = tokens.some((t) => Boolean(t.reading));
  const romajiLine = tokens
    .map((t) => t.romaji)
    .filter(Boolean)
    .join(" ");

  return (
    <div className={compact ? "kaiwa-script-help compact" : "kaiwa-script-help"}>
      <div
        className={`kaiwa-ruby-preview ${prefs.furigana ? "ruby-on" : "ruby-off"}`}
        lang="ja"
      >
        {tokens.map((t, ti) =>
          t.reading && prefs.furigana ? (
            <ruby key={ti}>
              {t.surface}
              <rt>{t.reading}</rt>
            </ruby>
          ) : (
            <span key={ti}>{t.surface}</span>
          ),
        )}
      </div>
      {prefs.furigana && !hasReading && (
        <div className="kaiwa-help-hint">
          Furigana bật — chưa có reading (nhập ở Soạn phụ đề).
        </div>
      )}
      {prefs.romaji && (
        <div className="kaiwa-romaji" lang="en">
          {romajiLine || "— chưa có romaji —"}
        </div>
      )}
      {prefs.vi &&
        (seg.vi ? (
          <div className="kaiwa-script-vi">{seg.vi}</div>
        ) : (
          <div className="kaiwa-help-hint">
            Việt bật — chưa có bản dịch cho đoạn này.
          </div>
        ))}
    </div>
  );
}
