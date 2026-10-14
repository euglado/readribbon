import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

// Registered by name through the guild endpoint; never bulk-replaces other commands.
export const command = new SlashCommandBuilder()
  .setName("readribbon")
  .setDescription("Privately estimate reading time; optionally share a summary without the text")
  .setDescriptionLocalizations({
    tr: "Okuma süresini özel hesapla; metinsiz özeti istersen paylaş",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
  .addStringOption((o) =>
    o
      .setName("text")
      .setDescription("Text to count (up to 4000 characters; sent to Discord and bot)")
      .setDescriptionLocalizations({
        tr: "Sayılacak metin (en fazla 4000 karakter; Discord ve bota iletilir)",
      })
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4000),
  )
  .addStringOption((o) =>
    o
      .setName("language")
      .setDescription("Word segmentation and result language")
      .setDescriptionLocalizations({ tr: "Sözcük ayrımı ve sonuç dili" })
      .addChoices({ name: "English", value: "en" }, { name: "Türkçe", value: "tr" }),
  )
  .addIntegerOption((o) =>
    o
      .setName("pace")
      .setDescription("Reading pace in words/minute; default 200, estimate only")
      .setDescriptionLocalizations({ tr: "Dakikadaki sözcük; varsayılan 200, yalnızca tahmin" })
      .setMinValue(100)
      .setMaxValue(600),
  )
  .addStringOption((o) =>
    o
      .setName("title")
      .setDescription("Optional PUBLIC title; do not put private text here")
      .setDescriptionLocalizations({ tr: "İsteğe bağlı HERKESE AÇIK başlık; özel metin yazmayın" })
      .setMaxLength(80),
  );
