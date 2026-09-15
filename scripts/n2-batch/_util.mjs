export function ruby(parts) {
  return parts.map(([text, reading]) =>
    reading ? { text, reading } : { text },
  );
}

export function buildExercises(groupId, lessonNum, pack, batchTag = "N2-L02-BATCH") {
  const note = `Lesson ${lessonNum} authored (${batchTag})`;
  const out = [];
  for (let i = 0; i < pack.viJa.length; i++) {
    const q = pack.viJa[i];
    out.push({
      id: `${groupId}-vi-ja-${String(i + 1).padStart(2, "0")}`,
      mode: "vi-ja",
      prompt: q.p,
      answers: [q.a],
      hint: q.h,
      explanation: q.e,
      origin: "authored",
      sourceNote: note,
    });
  }
  for (let i = 0; i < pack.jaVi.length; i++) {
    const q = pack.jaVi[i];
    out.push({
      id: `${groupId}-ja-vi-${String(i + 1).padStart(2, "0")}`,
      mode: "ja-vi",
      prompt: q.p,
      answers: [q.a],
      hint: q.h,
      explanation: q.e,
      origin: "authored",
      sourceNote: note,
    });
  }
  for (let i = 0; i < pack.order.length; i++) {
    const q = pack.order[i];
    if (q.t.length !== 4) throw new Error(`${groupId} order ${i + 1}: need 4 tokens`);
    out.push({
      id: `${groupId}-order-${String(i + 1).padStart(2, "0")}`,
      mode: "order",
      prompt: q.p,
      tokens: q.t.map((text, j) => ({ id: String(j), text })),
      acceptedOrders: [["0", "1", "2", "3"]],
      starIndex: q.s,
      hint: q.h,
      answers: [q.t.join("")],
      explanation: q.e,
      origin: "authored",
      sourceNote: note,
    });
  }
  if (pack.viJa.length !== 10 || pack.jaVi.length !== 10 || pack.order.length !== 10) {
    throw new Error(`${groupId}: need 10/10/10`);
  }
  return out;
}

export function makePattern(invGroup, theory, pack, lessonNum, batchTag = "N2-L02-BATCH") {
  return {
    id: invGroup.groupId,
    title: invGroup.canonicalPattern,
    meaning: theory.meaning,
    variants: [...invGroup.variants],
    structures: theory.structures,
    explanation: theory.explanation,
    usage: theory.usage,
    cautions: theory.cautions,
    contrast: theory.contrast,
    examples: theory.examples,
    source: {
      pdfPage: invGroup.pdfPage,
      printedPage: invGroup.printedPage,
      urls: [...invGroup.sourceUrls],
    },
    reviewStatus: "agent_reviewed",
    revision: 1,
    exercises: buildExercises(invGroup.groupId, lessonNum, pack, batchTag),
  };
}

/** Build 10/10/10 pack from VI↔JA pairs + order token rows; keeps examples out of practice via caller. */
export function packFrom(h, e, viJaPairs, jaViPairs, orders) {
  return {
    viJa: viJaPairs.map(([p, a]) => ({ p, a, h, e })),
    jaVi: jaViPairs.map(([p, a]) => ({ p, a, h, e })),
    order: orders.map(([p, t, s]) => ({
      p,
      t,
      s,
      h,
      e: e + " Ghép bốn mảnh theo đúng cấu trúc.",
    })),
  };
}

export function ex(ja, reading, vi, rubyParts) {
  return {
    ja,
    reading,
    vi,
    ruby: ruby(rubyParts || [[ja]]),
  };
}
