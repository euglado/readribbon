import { type Interaction, MessageFlags } from "discord.js";
import { authorize, type OutputChannel, type SupportedInteraction } from "./permissions.js";
import { analyze, type Language, type Report } from "./reading.js";
import type { Drafts } from "./store.js";
import { controls, privateFlags, safe, summary, text } from "./views.js";

export interface Dependencies {
  guild: string;
  application: string;
  drafts: Drafts;
  authorize?: (i: SupportedInteraction, fresh: boolean) => Promise<OutputChannel | null>;
}

export async function handle(i: Interaction, deps: Dependencies): Promise<void> {
  if (!i.isChatInputCommand() && !i.isButton()) return;
  if (i.isChatInputCommand() && i.commandName !== "readribbon") return;
  if (i.isButton() && !i.customId.startsWith("rr:")) return;
  let language: Language = i.locale === "tr" ? "tr" : "en";
  const say = async (en: string, tr: string) => {
    const content = text(language, en, tr);
    if (i.deferred || i.replied)
      await i.editReply({ content, components: [], allowedMentions: safe });
    else await i.reply({ content, flags: privateFlags, allowedMentions: safe });
  };
  if (!i.inGuild() || i.guildId !== deps.guild || i.applicationId !== deps.application) {
    await say(
      "Use this bot in its configured server.",
      "Bu botu yapılandırılmış sunucusunda kullanın.",
    );
    return;
  }
  const binding = { user: i.user.id, guild: i.guildId, channel: i.channelId };
  const check = deps.authorize ?? authorize;
  try {
    if (i.isChatInputCommand()) {
      const chosen = i.options.getString("language");
      if (chosen === "en" || chosen === "tr") language = chosen;
      if (!(await check(i, false))) {
        await say(
          "Both you and the bot need View Channel and Send Messages in a text or announcement channel.",
          "Normal metin veya duyuru kanalında sizin ve botun Kanalı Görüntüle / Mesaj Gönder izinleri olmalı.",
        );
        return;
      }
      if (!deps.drafts.reserveUser(binding)) {
        await say(
          "Please wait five seconds before another estimate, or retry when the bot is less busy.",
          "Yeni hesap için beş saniye bekleyin; bot yoğunsa daha sonra deneyin.",
        );
        return;
      }
      let report: Report;
      try {
        report = analyze(
          i.options.getString("text", true),
          i.options.getInteger("pace") ?? 200,
          chosen ?? language,
          i.options.getString("title") ?? "",
        );
      } catch {
        await say(
          "Use 1–4000 characters with at least one word, pace 100–600, English/Turkish, and a single-line title up to 80 characters without control characters.",
          "En az bir sözcüklü 1–4000 karakter, 100–600 hız, İngilizce/Türkçe ve kontrol karaktersiz tek satırlı en fazla 80 karakter başlık kullanın.",
        );
        return;
      }
      const id = deps.drafts.create(binding, report);
      if (!id) {
        await say(
          "Preview capacity reached. Please try again in five minutes.",
          "Önizleme kapasitesi doldu. Beş dakika sonra tekrar deneyin.",
        );
        return;
      }
      try {
        await i.reply({
          content: `${summary(report)}\n\n${text(
            language,
            "Only you see this. Share posts exactly the summary above in this channel, including the title. Discard removes the draft. Buttons expire in five minutes.",
            "Yalnızca siz görürsünüz. Paylaş, başlık dahil yukarıdaki özeti bu kanala gönderir. Vazgeç taslağı siler. Düğmeler beş dakika geçerlidir.",
          )}`,
          flags: privateFlags,
          components: controls(id, language),
          allowedMentions: safe,
        });
        const response = await i.fetchReply();
        deps.drafts.bind(id, response.id);
      } catch {
        deps.drafts.entries.delete(id);
        throw new Error("preview");
      }
      return;
    }
    if (!i.isButton()) return;
    const match = /^rr:(share|discard):([a-f0-9]{24})$/.exec(i.customId);
    if (
      !match ||
      i.message.author.id !== deps.application ||
      i.message.webhookId !== deps.application ||
      !i.message.flags.has(MessageFlags.Ephemeral)
    ) {
      await say(
        "This control is invalid. Run /readribbon again.",
        "Bu düğme geçersiz. /readribbon komutunu yeniden kullanın.",
      );
      return;
    }
    const id = match[2];
    if (!id) return;
    const sharing = match[1] === "share";
    const draft = deps.drafts.take(id, binding, i.message.id, sharing);
    if (!draft) {
      await say(
        "This draft expired, belongs elsewhere, was already used, or the channel is on its 60-second sharing cooldown. Retry /readribbon later.",
        "Taslak süresi doldu, başka kullanıcıya/kanala ait, kullanıldı veya kanalın 60 saniyelik paylaşım beklemesi sürüyor. /readribbon komutunu daha sonra deneyin.",
      );
      return;
    }
    language = draft.report.language;
    await i.deferUpdate();
    if (!sharing) {
      await say("Draft discarded. Nothing was posted.", "Taslak silindi. Paylaşım yapılmadı.");
      return;
    }
    const channel = await check(i, true);
    if (!channel) {
      await say(
        "Permissions changed or this channel is unsupported. Nothing was posted. Create a new preview after fixing permissions.",
        "İzinler değişti veya kanal desteklenmiyor. Paylaşım yapılmadı. İzinleri düzeltip yeni önizleme açın.",
      );
      return;
    }
    await channel.send({
      content: summary(draft.report),
      allowedMentions: safe,
      flags: MessageFlags.SuppressEmbeds,
      nonce: id,
      enforceNonce: true,
    });
    await say(
      "Summary shared. The source text was not posted.",
      "Özet paylaşıldı. Kaynak metin gönderilmedi.",
    );
  } catch {
    // Never log SDK errors, request bodies, interaction objects, tokens or input text.
    console.error(
      "Discord action failed; check connectivity and channel permissions. No automatic resend.",
    );
    try {
      await say(
        "Discord could not finish this action. A summary may already have been sent; check the channel before trying again. Drafts are not retried automatically.",
        "Discord işlemi tamamlayamadı. Özet gönderilmiş olabilir; yeniden denemeden kanalı kontrol edin. Taslaklar otomatik tekrar gönderilmez.",
      );
    } catch {
      /* An expired Discord interaction cannot receive another reply. */
    }
  }
}
