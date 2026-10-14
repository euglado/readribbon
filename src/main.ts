import { Events } from "discord.js";
import { createClient } from "./client.js";
import { config } from "./config.js";
import { handle } from "./handler.js";
import { Drafts } from "./store.js";

async function main(): Promise<void> {
  const settings = config();
  const client = createClient();
  const drafts = new Drafts();
  const cleanup = setInterval(() => drafts.sweep(), 30000);
  cleanup.unref();
  const stop = () => {
    clearInterval(cleanup);
    drafts.entries.clear();
    drafts.users.clear();
    drafts.channels.clear();
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  client.once(Events.ClientReady, () =>
    console.log("ReadRibbon ready / hazır. One configured server; /readribbon."),
  );
  client.on(Events.Error, () =>
    console.error("Discord connection error; check network and setup. Details withheld."),
  );
  client.on(Events.InteractionCreate, (i) => {
    void handle(i, { guild: settings.guild, application: settings.application, drafts }).catch(
      () => {
        console.error("Interaction could not be answered; try the command again.");
      },
    );
  });
  try {
    await client.login(settings.token);
  } catch {
    stop();
    throw new Error(
      "Could not log in. Check the token using npm run setup and your network; token details are never printed.",
    );
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Startup failed; run npm run setup.");
  process.exitCode = 1;
});
