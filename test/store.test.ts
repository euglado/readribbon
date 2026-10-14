import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze } from "../src/reading.js";
import { Drafts } from "../src/store.js";

const binding = { user: "user", guild: "guild", channel: "channel" };
const report = analyze("hello world", 200, "en", "Title");
function fixture() {
  let clock = 1000;
  const store = new Drafts(() => clock);
  const id = store.create(binding, report);
  assert.ok(id);
  store.bind(id, "message");
  return {
    store,
    id,
    advance: (n: number) => {
      clock += n;
    },
  };
}
for (const field of ["user", "guild", "channel"] as const) {
  test(`reject wrong ${field} without consuming original`, () => {
    const { store, id } = fixture();
    assert.equal(store.take(id, { ...binding, [field]: "wrong" }, "message", true), null);
    assert.ok(store.take(id, binding, "message", true));
  });
}
test("reject unbound, missing and wrong message controls", () => {
  const { store, id } = fixture();
  assert.equal(store.take(id, binding, "wrong", true), null);
  assert.equal(store.take("missing", binding, "message", true), null);
  const unbound = store.create(binding, report);
  assert.ok(unbound);
  assert.equal(store.take(unbound, binding, "message", true), null);
});
test("share is consumed exactly once", () => {
  const { store, id } = fixture();
  assert.ok(store.take(id, binding, "message", true));
  assert.equal(store.take(id, binding, "message", true), null);
});
test("draft expires at five minutes and sweep clears it", () => {
  const { store, id, advance } = fixture();
  advance(300000);
  assert.equal(store.take(id, binding, "message", true), null);
  assert.equal(store.entries.size, 0);
});
test("share throttle is per channel and allows retry at 60 seconds", () => {
  const { store, id, advance } = fixture();
  store.take(id, binding, "message", true);
  const next = store.create(binding, report);
  assert.ok(next);
  store.bind(next, "message");
  assert.equal(store.take(next, binding, "message", true), null);
  advance(60000);
  assert.ok(store.take(next, binding, "message", true));
});
test("discard bypasses channel cooldown and never creates one", () => {
  const { store, id } = fixture();
  store.channels.set("guild:channel", 99999);
  assert.ok(store.take(id, binding, "message", false));
  assert.equal(store.channels.size, 1);
  assert.equal(store.entries.size, 0);
});
test("user cooldown expires at five seconds", () => {
  const { store, advance } = fixture();
  assert.equal(store.reserveUser(binding), true);
  assert.equal(store.reserveUser(binding), false);
  advance(5000);
  assert.equal(store.reserveUser(binding), true);
});
test("draft and cooldown maps have hard caps", () => {
  const store = new Drafts(() => 1);
  for (let n = 0; n < 100; n++) assert.ok(store.create({ ...binding, user: String(n) }, report));
  assert.equal(store.create(binding, report), null);
  for (let n = 0; n < 500; n++) assert.ok(store.reserveUser({ ...binding, user: String(n) }));
  assert.equal(store.reserveUser({ ...binding, user: "overflow" }), false);
  for (let n = 0; n < 500; n++) store.channels.set(String(n), 99999);
  const first = store.entries.keys().next().value;
  assert.ok(first);
  store.bind(first, "message");
  assert.equal(store.take(first, { ...binding, user: "0" }, "message", true), null);
});
test("expired cooldown maps are pruned", () => {
  const { store, advance } = fixture();
  store.reserveUser(binding);
  store.channels.set("old", 1001);
  advance(60000);
  store.sweep();
  assert.equal(store.users.size, 0);
  assert.equal(store.channels.size, 0);
});
