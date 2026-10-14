import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  escapeMarkdown,
  MessageFlags,
} from "discord.js";
import { duration, type Language, type Report } from "./reading.js";

export const safe = { parse: [] as never[], repliedUser: false };
export const privateFlags = MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds;
export function text(language: Language, en: string, tr: string): string {
  return language === "tr" ? tr : en;
}
export function summary(report: Report): string {
  const title = report.title ? `\n${escapeMarkdown(report.title.replaceAll("@", "＠"))}` : "";
  return text(
    report.language,
    `**ReadRibbon · Reading estimate**${title}\n${report.words} words · ${report.characters} Unicode code points\nApprox. ${duration(report.seconds, "en")} at ${report.pace} words/min.\nEstimate only; formatting, links and code are counted as input. Actual pace varies. Source text is not included.`,
    `**ReadRibbon · Okuma tahmini**${title}\n${report.words} sözcük · ${report.characters} Unicode kod noktası\n${report.pace} sözcük/dk hızında yaklaşık ${duration(report.seconds, "tr")}.\nYalnızca tahmin; biçimlendirme, bağlantı ve kodlar girdiye dahildir. Gerçek hız değişir. Kaynak metin dahil değildir.`,
  );
}
export function controls(id: string, language: Language): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`rr:share:${id}`)
        .setStyle(ButtonStyle.Primary)
        .setLabel(text(language, "Share this summary", "Bu özeti paylaş")),
      new ButtonBuilder()
        .setCustomId(`rr:discard:${id}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(text(language, "Discard", "Vazgeç")),
    ),
  ];
}
