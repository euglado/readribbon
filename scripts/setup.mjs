import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function hidden(question) {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Interactive terminal required / Etkileşimli terminal gerekli.");
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    function done(error) {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    }
    function onData(chunk) {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          done(new Error("Setup cancelled / Kurulum iptal edildi."));
          return;
        }
        if (character === "\r" || character === "\n") {
          done();
          return;
        }
        if (character === "\b" || character === "\u007f") value = value.slice(0, -1);
        else if (/^[\x21-\x7e]$/.test(character) && value.length < 512) value += character;
      }
    }
    process.stdin.on("data", onData);
  });
}
async function setup() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Open setup in a terminal / Kurulumu terminalde açın. No file written.");
  const file = path.join(root, ".env");
  if (existsSync(file))
    throw new Error(
      ".env exists. Keep it safe; delete it yourself only if you want to configure again / .env mevcut; yeniden kurmak için kendiniz kaldırın.",
    );
  console.log(
    "ReadRibbon setup / kurulum. Values stay in local .env; never share this file. Token is hidden.",
  );
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  let application;
  let guild;
  try {
    application = (await rl.question("Application ID / Uygulama kimliği: ")).trim();
    guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
    if (!/^\d{17,20}$/.test(application) || !/^\d{17,20}$/.test(guild))
      throw new Error("IDs must be 17–20 digits / Kimlikler 17–20 rakam olmalı.");
    const invite = `https://discord.com/oauth2/authorize?client_id=${application}&scope=bot%20applications.commands&permissions=3072&guild_id=${guild}&disable_guild_select=true`;
    console.log(`Open this invite in your browser / Daveti tarayıcıda açın:\n${invite}`);
    const answer = (
      await rl.question(
        "Installed in the correct server? Type YES / Doğru sunucuya eklendi mi? YES yazın: ",
      )
    ).trim();
    if (answer !== "YES")
      throw new Error("Install first, then rerun setup / Önce ekleyin, sonra kurulumu açın.");
  } finally {
    rl.close();
  }
  const token = await hidden("Bot token (hidden / gizli): ");
  if (!token || token.length < 20 || !/^[A-Za-z0-9._-]+$/.test(token))
    throw new Error("Token format invalid / Token biçimi geçersiz.");
  const lines = [
    "DISCORD_TOKEN=" + token,
    "DISCORD_APPLICATION_ID=" + application,
    "DISCORD_GUILD_ID=" + guild,
    "",
  ];
  writeFileSync(file, lines.join("\n"), { flag: "wx", mode: 0o600 });
  console.log(
    "Saved .env. Next: npm run build, npm run register, npm start. / Kaydedildi. Sonraki adımlar aynı komutlardır.",
  );
}
setup().catch((error) => {
  console.error(error instanceof Error ? error.message : "Setup failed; no token displayed.");
  process.exitCode = 1;
});
