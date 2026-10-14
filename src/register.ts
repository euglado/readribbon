import { REST, Routes } from "discord.js";
import { command } from "./command.js";
import { config } from "./config.js";

async function register(): Promise<void> {
  const settings = config();
  const rest = new REST({ version: "10", timeout: 10000, retries: 0 }).setToken(settings.token);
  try {
    await rest.post(Routes.applicationGuildCommands(settings.application, settings.guild), {
      body: command.toJSON(),
    });
  } catch {
    throw new Error(
      "Command registration failed. Check application/server IDs, token, network and installation. No request details are logged.",
    );
  }
  console.log(
    "/readribbon registered in the configured server. Other command names were not replaced.",
  );
}
register().catch((error) => {
  console.error(error instanceof Error ? error.message : "Registration failed.");
  process.exitCode = 1;
});
