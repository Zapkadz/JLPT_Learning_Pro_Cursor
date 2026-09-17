/**
 * Synthetic Kaiwa media fixtures — generated in memory only.
 * Do NOT commit private user recordings or large real videos.
 */

function u32(n: number) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

function box(type: string, body: Buffer) {
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "ascii"), body]);
}

export type SyntheticMp4Opts = {
  durationSec: number;
  timescale?: number;
  /** Include a trak with avc1 (video). */
  hasVideo?: boolean;
  /** Include mp4a marker bytes so sniff reports audio. */
  hasAudio?: boolean;
  /** Extra free-form payload (weird metadata). */
  extra?: Buffer;
  brand?: string;
};

/** Minimal ISO-BMFF MP4 suitable for sniff probe (not a real decoder bitstream). */
export function syntheticMp4(opts: SyntheticMp4Opts): Buffer {
  const timescale = opts.timescale ?? 1000;
  const hasVideo = opts.hasVideo !== false;
  const brand = (opts.brand || "isom").slice(0, 4);
  const ftyp = box(
    "ftyp",
    Buffer.concat([
      Buffer.from(brand),
      u32(0),
      Buffer.from(brand),
      Buffer.from("mp41"),
    ]),
  );
  const mvhdBody = Buffer.alloc(100);
  mvhdBody.writeUInt32BE(timescale, 12);
  mvhdBody.writeUInt32BE(Math.round(opts.durationSec * timescale), 16);
  mvhdBody.writeUInt32BE(0x00010000, 20);
  mvhdBody.writeUInt16BE(0x0100, 24);
  const mvhd = box("mvhd", mvhdBody);

  const parts: Buffer[] = [mvhd];
  if (hasVideo) {
    // tkhd + mdia stubs; "avc1" marker for codec sniff
    const tkhd = box("tkhd", Buffer.alloc(84));
    const mdia = box(
      "mdia",
      Buffer.concat([
        box("mdhd", Buffer.alloc(24)),
        box("hdlr", Buffer.from("vide")),
        box("minf", Buffer.from("avc1")),
      ]),
    );
    parts.push(box("trak", Buffer.concat([tkhd, mdia])));
  }
  if (opts.hasAudio) {
    parts.push(
      box(
        "trak",
        Buffer.concat([
          box("tkhd", Buffer.alloc(84)),
          box("mdia", Buffer.from("mp4a")),
        ]),
      ),
    );
  }
  if (opts.extra) parts.push(opts.extra);
  const moov = box("moov", Buffer.concat(parts));
  return Buffer.concat([ftyp, moov]);
}

/** Portrait intent metadata — companion only (sniff does not decode pixels). */
export type FixtureMeta = {
  id: string;
  label: string;
  kind:
    | "short"
    | "long"
    | "too_long"
    | "vertical"
    | "silent"
    | "weird"
    | "corrupt";
  bytes: Buffer;
  intended?: { width?: number; height?: number; rotation?: number };
  expectProbeOk: boolean;
  expectPilotReject?: boolean;
};

export function buildFixtureSet(): FixtureMeta[] {
  return [
    {
      id: "short-ok",
      label: "Video ngắn (~3s)",
      kind: "short",
      bytes: syntheticMp4({ durationSec: 3, hasAudio: true }),
      expectProbeOk: true,
    },
    {
      id: "long-ok",
      label: "Video dài metadata (~8 phút, vẫn trong pilot)",
      kind: "long",
      bytes: syntheticMp4({ durationSec: 8 * 60, hasAudio: true }),
      expectProbeOk: true,
    },
    {
      id: "too-long",
      label: "Quá dài pilot (>10 phút)",
      kind: "too_long",
      bytes: syntheticMp4({ durationSec: 11 * 60 }),
      expectProbeOk: true,
      expectPilotReject: true,
    },
    {
      id: "vertical-intent",
      label: "Dọc (1080×1920 intent — companion metadata)",
      kind: "vertical",
      bytes: syntheticMp4({
        durationSec: 5,
        hasAudio: true,
        extra: box(
          "udta",
          Buffer.from("kaiwa:portrait:1080x1920:rot90", "utf8"),
        ),
      }),
      intended: { width: 1080, height: 1920, rotation: 90 },
      expectProbeOk: true,
    },
    {
      id: "silent",
      label: "Im lặng (không track audio)",
      kind: "silent",
      bytes: syntheticMp4({ durationSec: 4, hasAudio: false }),
      expectProbeOk: true,
    },
    {
      id: "weird-moov-late",
      label: "Metadata lạ — chỉ ftyp trong prefix (moov giả định ở cuối)",
      kind: "weird",
      // ftyp only → sniff still ok with null duration
      bytes: box(
        "ftyp",
        Buffer.concat([
          Buffer.from("isom"),
          u32(0),
          Buffer.from("isom"),
          Buffer.from("mp41"),
        ]),
      ),
      expectProbeOk: true,
    },
    {
      id: "corrupt-fake-ext",
      label: "Hỏng / đuôi giả",
      kind: "corrupt",
      bytes: Buffer.from("this-is-not-a-video-file"),
      expectProbeOk: false,
    },
  ];
}
