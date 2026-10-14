import assert from "node:assert/strict";
import { test } from "node:test";
import { type Interaction, MessageFlags, MessageFlagsBitField } from "discord.js";
import { type Dependencies, handle } from "../src/handler.js";
import type { OutputChannel } from "../src/permissions.js";
import { Drafts } from "../src/store.js";

function fixture() {
  const sent: Record<string, unknown>[] = [];
  const replies: Record<string, unknown>[] = [];
  const edits: Record<string, unknown>[] = [];
  const freshChecks: boolean[] = [];
  const drafts = new Drafts();
  let allow = true;
  let failSend = false;
  const channel = {
    send: async (data: Record<string, unknown>) => {
      sent.push(data);
      if (failSend) throw new Error("request deliberately unavailable");
      return {};
    },
  } as unknown as OutputChannel;
  const deps: Dependencies = {
    guild: "guild",
    application: "app",
    drafts,
    authorize: async (_i, fresh) => {
      freshChecks.push(fresh);
      return allow ? channel : null;
    },
  };
  const values: Record<string, string | number | null> = {
    text: "PRIVATE_SOURCE_SENTINEL hello world",
    title: "Book club",
    language: "en",
    pace: 200,
  };
  const command = {
    isChatInputCommand: () => true,
    isButton: () => false,
    inGuild: () => true,
    commandName: "readribbon",
    locale: "en",
    guildId: "guild",
    channelId: "channel",
    applicationId: "app",
    user: { id: "user" },
    deferred: false,
    replied: false,
    options: { getString: (key: string) => values[key], getInteger: (key: string) => values[key] },
    reply: async (data: Record<string, unknown>) => {
      replies.push(data);
    },
    fetchReply: async () => ({ id: "preview" }),
    editReply: async (data: Record<string, unknown>) => {
      edits.push(data);
    },
  };
  function button(action = "share") {
    const id = drafts.entries.keys().next().value ?? "0".repeat(24);
    return {
      ...command,
      isChatInputCommand: () => false,
      isButton: () => true,
      customId: `rr:${action}:${id}`,
      message: {
        id: "preview",
        author: { id: "app" },
        webhookId: "app",
        flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
      },
      deferUpdate: async function () {
        this.deferred = true;
      },
    };
  }
  const run = (i: unknown) => handle(i as Interaction, deps);
  return {
    sent,
    replies,
    edits,
    drafts,
    command,
    values,
    button,
    run,
    freshChecks,
    deny: () => {
      allow = false;
    },
    failSend: () => {
      failSend = true;
    },
  };
}

test("preview is ephemeral and contains no original text; only summary retained", async () => {
  const f = fixture();
  await f.run(f.command);
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.entries.size, 1);
  assert.equal(f.replies[0]?.flags, MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds);
  assert.ok(!JSON.stringify(f.replies).includes("PRIVATE_SOURCE_SENTINEL"));
  assert.ok(!JSON.stringify([...f.drafts.entries]).includes("PRIVATE_SOURCE_SENTINEL"));
});
test("explicit share rechecks permissions and sends once with nonce and no mentions", async () => {
  const f = fixture();
  await f.run(f.command);
  const b = f.button();
  await Promise.all([f.run(b), f.run({ ...b })]);
  assert.equal(f.sent.length, 1);
  assert.deepEqual(f.freshChecks, [false, true]);
  assert.equal(f.sent[0]?.enforceNonce, true);
  assert.match(String(f.sent[0]?.nonce), /^[a-f0-9]{24}$/);
  assert.deepEqual(f.sent[0]?.allowedMentions, { parse: [], repliedUser: false });
  assert.equal(f.sent[0]?.flags, MessageFlags.SuppressEmbeds);
  assert.ok(!JSON.stringify(f.sent).includes("PRIVATE_SOURCE_SENTINEL"));
  assert.equal(f.drafts.entries.size, 0);
});
test("discard deletes draft and posts nothing", async () => {
  const f = fixture();
  await f.run(f.command);
  await f.run(f.button("discard"));
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.entries.size, 0);
  assert.equal(f.drafts.channels.size, 0);
});
test("revoked permission consumes draft without posting", async () => {
  const f = fixture();
  await f.run(f.command);
  f.deny();
  await f.run(f.button());
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.entries.size, 0);
  assert.ok(String(f.edits[0]?.content).includes("Permissions changed"));
});
test("initial permissions required", async () => {
  const f = fixture();
  f.deny();
  await f.run(f.command);
  assert.equal(f.drafts.entries.size, 0);
  assert.equal(f.sent.length, 0);
});
for (const key of ["guildId", "channelId", "applicationId"] as const) {
  test(`reject foreign ${key}`, async () => {
    const f = fixture();
    await f.run(f.command);
    const b = f.button();
    b[key] = "wrong";
    await f.run(b);
    assert.equal(f.sent.length, 0);
    assert.equal(f.drafts.entries.size, 1);
  });
}
test("wrong button owner cannot consume draft", async () => {
  const f = fixture();
  await f.run(f.command);
  const b = f.button();
  b.user = { id: "other" };
  await f.run(b);
  assert.equal(f.sent.length, 0);
  assert.equal(f.drafts.entries.size, 1);
});
for (const mode of ["author", "webhook", "message", "public", "malformed"] as const) {
  test(`reject forged control ${mode}`, async () => {
    const f = fixture();
    await f.run(f.command);
    const b = f.button();
    if (mode === "author") b.message.author.id = "wrong";
    if (mode === "webhook") b.message.webhookId = "wrong";
    if (mode === "message") b.message.id = "wrong";
    if (mode === "public") b.message.flags = new MessageFlagsBitField();
    if (mode === "malformed") b.customId = "rr:share:bad";
    await f.run(b);
    assert.equal(f.sent.length, 0);
    assert.equal(f.drafts.entries.size, 1);
  });
}
test("failed send stays consumed; logs omit input; retry cannot send", async () => {
  const f = fixture();
  await f.run(f.command);
  const b = f.button();
  f.failSend();
  const messages: unknown[][] = [];
  const original = console.error;
  console.error = (...items) => {
    messages.push(items);
  };
  try {
    await f.run(b);
    await f.run({ ...b });
  } finally {
    console.error = original;
  }
  assert.equal(f.sent.length, 1);
  assert.equal(f.drafts.entries.size, 0);
  assert.ok(!JSON.stringify(messages).includes("PRIVATE_SOURCE_SENTINEL"));
  assert.ok(String(f.edits[0]?.content).includes("may already have been sent"));
});
test("failed preview response removes unbound draft", async () => {
  const f = fixture();
  f.command.fetchReply = async () => {
    throw new Error("offline");
  };
  const original = console.error;
  console.error = () => {};
  try {
    await f.run(f.command);
  } finally {
    console.error = original;
  }
  assert.equal(f.drafts.entries.size, 0);
});
test("invalid input gets useful error and no draft", async () => {
  const f = fixture();
  f.values.text = "...";
  await f.run(f.command);
  assert.equal(f.drafts.entries.size, 0);
  assert.ok(String(f.replies[0]?.content).includes("at least one word"));
});
test("second command is throttled", async () => {
  const f = fixture();
  await f.run(f.command);
  await f.run(f.command);
  assert.equal(f.drafts.entries.size, 1);
  assert.ok(String(f.replies[1]?.content).includes("five seconds"));
});
test("Turkish language fallback and result", async () => {
  const f = fixture();
  f.command.locale = "tr";
  f.values.language = null;
  await f.run(f.command);
  await f.run(f.button());
  assert.ok(String(f.sent[0]?.content).includes("Okuma tahmini"));
});
test("ignores unrelated commands and rejects DMs", async () => {
  const f = fixture();
  f.command.commandName = "other";
  await f.run(f.command);
  assert.equal(f.replies.length, 0);
  f.command.commandName = "readribbon";
  f.command.inGuild = () => false;
  await f.run(f.command);
  assert.equal(f.drafts.entries.size, 0);
  assert.equal(f.sent.length, 0);
});
