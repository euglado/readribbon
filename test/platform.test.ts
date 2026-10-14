import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ChannelType,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  type User,
} from "discord.js";
import { createClient } from "../src/client.js";
import { command } from "../src/command.js";
import { config } from "../src/config.js";
import { authorize, type SupportedInteraction } from "../src/permissions.js";

test("configuration validates IDs and never includes values in errors", () => {
  assert.throws(() => config({}), /Setup required/);
  assert.throws(
    () =>
      config({
        DISCORD_TOKEN: "input-private-value",
        DISCORD_APPLICATION_ID: "wrong",
        DISCORD_GUILD_ID: "wrong",
      }),
    (error) => error instanceof Error && !error.message.includes("input-private-value"),
  );
  const result = config({
    DISCORD_TOKEN: "placeholder",
    DISCORD_APPLICATION_ID: "1".repeat(18),
    DISCORD_GUILD_ID: "2".repeat(18),
  });
  assert.equal(result.guild.length, 18);
});
test("guild command shape uses bounded inputs and minimal default member permissions", () => {
  const json = command.toJSON();
  assert.equal(json.name, "readribbon");
  assert.equal(json.default_member_permissions, PermissionFlagsBits.SendMessages.toString());
  assert.equal(json.options?.length, 4);
  assert.equal(json.options?.[0]?.required, true);
  assert.equal(json.dm_permission, undefined);
});
test("client uses only Guilds intent and disables personal/message caches", () => {
  const client = createClient();
  assert.equal(client.options.intents.bitfield, GatewayIntentBits.Guilds);
  assert.equal(client.options.rest?.retries, 0);
  assert.deepEqual(client.options.allowedMentions?.parse, []);
  client.users.cache.set("probe", {} as User);
  assert.equal(client.users.cache.size, 0);
  client.destroy();
});

function permissionsFixture() {
  let memberAllowed = true;
  let botAllowed = true;
  const fetched: unknown[] = [];
  const member = { id: "member" };
  const bot = { id: "bot" };
  const channel = {
    type: ChannelType.GuildText,
    permissionsFor: (who: { id: string }) =>
      new PermissionsBitField(
        (who.id === "member" ? memberAllowed : botAllowed)
          ? PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages
          : PermissionFlagsBits.ViewChannel,
      ),
  };
  const i = {
    inGuild: () => true,
    channelId: "channel",
    channel,
    user: member,
    appPermissions: new PermissionsBitField(
      PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages,
    ),
    memberPermissions: new PermissionsBitField(
      PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages,
    ),
    guild: {
      channels: {
        fetch: async (...args: unknown[]) => {
          fetched.push(args);
          return channel;
        },
      },
      members: {
        fetch: async (args: unknown) => {
          fetched.push(args);
          return member;
        },
        fetchMe: async (args: unknown) => {
          fetched.push(args);
          return bot;
        },
      },
    },
  };
  return {
    i,
    channel,
    fetched,
    denyMember: () => {
      memberAllowed = false;
    },
    denyBot: () => {
      botAllowed = false;
    },
    check: (fresh: boolean) => authorize(i as unknown as SupportedInteraction, fresh),
  };
}
test("publication fetches channel/member/bot afresh without retaining member cache", async () => {
  const f = permissionsFixture();
  assert.equal(await f.check(true), f.channel);
  assert.equal(f.fetched.length, 3);
  assert.deepEqual(f.fetched[0], ["channel", { force: true }]);
  assert.deepEqual(f.fetched[1], { user: "member", force: true, cache: false });
  assert.deepEqual(f.fetched[2], { force: true, cache: false });
});
for (const who of ["member", "bot"] as const) {
  test(`publication rejects revoked ${who} permission`, async () => {
    const f = permissionsFixture();
    if (who === "member") f.denyMember();
    else f.denyBot();
    assert.equal(await f.check(true), null);
  });
}
for (const type of [
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.GuildVoice,
  ChannelType.GuildForum,
] as const) {
  test(`reject channel type ${type}`, async () => {
    const f = permissionsFixture();
    f.channel.type = type;
    assert.equal(await f.check(false), null);
    assert.equal(await f.check(true), null);
  });
}
test("announcement channel supported", async () => {
  const f = permissionsFixture();
  f.channel.type = ChannelType.GuildAnnouncement;
  assert.equal(await f.check(false), f.channel);
});
test("initial permission snapshots and DM rejection", async () => {
  const f = permissionsFixture();
  f.i.memberPermissions = new PermissionsBitField();
  assert.equal(await f.check(false), null);
  f.i.inGuild = () => false;
  assert.equal(await f.check(true), null);
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
for (const [label, relative] of [
  ["startup", "dist/src/main.js"],
  ["registration", "dist/src/register.js"],
  ["noninteractive setup", "scripts/setup.mjs"],
] as const) {
  test(`${label} fails safely without config or file writes`, () => {
    const base = path.resolve(tmpdir());
    const directory = mkdtempSync(path.join(base, "readribbon-test-"));
    try {
      const result = spawnSync(process.execPath, [path.join(root, relative)], {
        cwd: directory,
        encoding: "utf8",
        timeout: 10000,
        env: {
          ...process.env,
          DISCORD_TOKEN: "",
          DISCORD_APPLICATION_ID: "",
          DISCORD_GUILD_ID: "",
        },
      });
      assert.equal(result.status, 1, result.stderr);
      assert.deepEqual(readdirSync(directory), []);
      assert.ok(!result.stderr.includes("Authorization:"));
    } finally {
      assert.equal(path.dirname(path.resolve(directory)), base);
      assert.ok(path.basename(directory).startsWith("readribbon-test-"));
      rmSync(directory, { recursive: true });
    }
  });
}
