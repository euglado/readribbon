import {
  type ButtonInteraction,
  ChannelType,
  type ChatInputCommandInteraction,
  type NewsChannel,
  PermissionFlagsBits,
  type TextChannel,
} from "discord.js";
export type SupportedInteraction = ChatInputCommandInteraction | ButtonInteraction;
export type OutputChannel = TextChannel | NewsChannel;
const required = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;

export async function authorize(
  i: SupportedInteraction,
  fresh: boolean,
): Promise<OutputChannel | null> {
  if (!i.inGuild() || !i.guild) return null;
  const channel = fresh ? await i.guild.channels.fetch(i.channelId, { force: true }) : i.channel;
  if (
    !channel ||
    (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)
  )
    return null;
  if (!fresh)
    return i.memberPermissions?.has(required) && i.appPermissions?.has(required) ? channel : null;
  const [member, bot] = await Promise.all([
    i.guild.members.fetch({ user: i.user.id, force: true, cache: false }),
    i.guild.members.fetchMe({ force: true, cache: false }),
  ]);
  return channel.permissionsFor(member)?.has(required) && channel.permissionsFor(bot)?.has(required)
    ? channel
    : null;
}
