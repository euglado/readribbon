export type Language = "en" | "tr";
export interface Report {
  words: number;
  characters: number;
  seconds: number;
  pace: number;
  language: Language;
  title: string;
}

// No source text is returned: long-lived drafts contain only the summary.
export function analyze(text: string, pace: number, language: string, title: string): Report {
  if (text.length < 1 || text.length > 4000 || !text.trim()) throw new Error("text");
  if (!Number.isInteger(pace) || pace < 100 || pace > 600) throw new Error("pace");
  if (language !== "en" && language !== "tr") throw new Error("language");
  if (title.length > 80 || /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u.test(title)) throw new Error("title");
  const segmenter = new Intl.Segmenter(language, { granularity: "word" });
  let words = 0;
  for (const segment of segmenter.segment(text)) if (segment.isWordLike) words++;
  if (!words) throw new Error("words");
  return {
    words,
    characters: Array.from(text).length,
    seconds: Math.ceil((words * 60) / pace),
    pace,
    language,
    title: title.trim(),
  };
}

export function duration(seconds: number, language: Language): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return language === "tr" ? `${minutes} dk ${remainder} sn` : `${minutes} min ${remainder} sec`;
}
