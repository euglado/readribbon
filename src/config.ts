export interface Config {
  token: string;
  application: string;
  guild: string;
}
export function config(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env.DISCORD_TOKEN?.trim() ?? "";
  const application = env.DISCORD_APPLICATION_ID?.trim() ?? "";
  const guild = env.DISCORD_GUILD_ID?.trim() ?? "";
  if (
    !token ||
    /\s/.test(token) ||
    !/^\d{17,20}$/.test(application) ||
    !/^\d{17,20}$/.test(guild)
  ) {
    throw new Error(
      "Setup required / Kurulum gerekli: run npm run setup, then npm run build and npm run register. Never paste your token into logs or chat.",
    );
  }
  return { token, application, guild };
}
