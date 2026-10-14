import { Client, GatewayIntentBits, Options } from "discord.js";
export function createClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [], repliedUser: false },
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      UserManager: 0,
      GuildMemberManager: 0,
    }),
    rest: { timeout: 10000, retries: 0 },
  });
}
