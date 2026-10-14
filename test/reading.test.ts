import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, duration } from "../src/reading.js";
import { summary } from "../src/views.js";

for (const [input, language, count] of [
  ["Hello world", "en", 2],
  ["Merhaba dünya, bugün güzel!", "tr", 4],
  ["one\ntwo\tthree", "en", 3],
  ["123 456", "en", 2],
  ["İstanbul'da kitap okuyoruz", "tr", 3],
  ["don't stop", "en", 2],
  ["Hello 👩‍👩‍👦 world", "en", 2],
  ["hello,world", "en", 2],
] as const) {
  test(`word segmentation: ${language} / ${input}`, () => {
    const result = analyze(input, 200, language, "");
    assert.equal(result.words, count);
    assert.equal(result.characters, Array.from(input).length);
    assert.equal(result.seconds, Math.ceil((count * 60) / 200));
  });
}
for (const input of ["", "  \n\t", "...", "😀😀", "a".repeat(4001)]) {
  test(`reject empty, punctuation-only or oversized input ${input.length}`, () => {
    assert.throws(() => analyze(input, 200, "en", ""));
  });
}
for (const pace of [99, 601, 100.1, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`reject pace ${pace}`, () => assert.throws(() => analyze("word", pace, "en", "")));
}
test("pace boundaries and exact one-minute rounding", () => {
  assert.equal(analyze("word ".repeat(100), 100, "en", "").seconds, 60);
  assert.equal(analyze("word ".repeat(101), 100, "en", "").seconds, 61);
  assert.equal(analyze("word", 600, "en", "").seconds, 1);
  assert.equal(duration(61, "en"), "1 min 1 sec");
  assert.equal(duration(61, "tr"), "1 dk 1 sn");
});
test("maximum input accepted; no source retained in result", () => {
  const result = analyze("abc ".repeat(1000), 200, "en", "  Book club  ");
  assert.equal(result.words, 1000);
  assert.equal(result.title, "Book club");
  assert.deepEqual(Object.keys(result).sort(), [
    "characters",
    "language",
    "pace",
    "seconds",
    "title",
    "words",
  ]);
});
for (const title of [
  "a".repeat(81),
  "line\nbreak",
  "control\u0000",
  "spoof\u202e",
  "line\u2028break",
]) {
  test(`reject unsafe title length ${title.length}`, () =>
    assert.throws(() => analyze("word", 200, "en", title)));
}
test("unsupported segmentation language rejected", () => {
  assert.throws(() => analyze("word", 200, "zh", ""));
});
test("summary escapes formatting and neutralizes mentions, includes caveat", () => {
  const output = summary(analyze("PRIVATE_SOURCE_SENTINEL", 200, "en", "**@everyone**"));
  assert.ok(output.includes("\\*\\*＠everyone\\*\\*"));
  assert.ok(!output.includes("PRIVATE_SOURCE_SENTINEL"));
  assert.ok(output.includes("Estimate only"));
  assert.ok(output.length < 1000);
  assert.ok(summary(analyze("Merhaba dünya", 200, "tr", "Başlık")).includes("Yalnızca tahmin"));
});
