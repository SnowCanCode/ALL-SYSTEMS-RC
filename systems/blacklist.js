const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Blacklist = require('../utils/blacklistSchema');
const config = require('../config/config');

module.exports = (client) => {

  // =========================
  // REGISTER COMMANDS
  // =========================
  client.once('ready', async () => {
    const commands = [
      new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage the blacklist')
        .addSubcommand(sub => sub
          .setName('add')
          .setDescription('Add a user to the blacklist')
          .addStringOption(opt => opt
            .setName('userid')
            .setDescription('The user ID to blacklist')
            .setRequired(true))
          .addStringOption(opt => opt
            .setName('reason')
            .setDescription('Reason for blacklisting')
            .setRequired(true)))
        .addSubcommand(sub => sub
          .setName('remove')
          .setDescription('Remove a user from the blacklist')
          .addStringOption(opt => opt
            .setName('userid')
            .setDescription('The user ID to remove')
            .setRequired(true)))
        .addSubcommand(sub => sub
          .setName('list')
          .setDescription('View all blacklisted users'))
    ];

    await client.application.commands.set(commands);
    console.log('Slash commands registered');
  });

  // =========================
  // HANDLE COMMANDS
  // =========================
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName !== 'blacklist') return;

    // HR check
    const member = interaction.member;
    const isHR = config.HR_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));
    if (!isHR) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription('❌ You do not have permission to use this command.')
        ],
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();

    // =========================
    // /blacklist add
    // =========================
    if (sub === 'add') {
      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason');

      // Check if already blacklisted
      const existing = await Blacklist.findOne({ userId });
      if (existing) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription(`❌ <@${userId}> is already blacklisted.`)
          ],
          ephemeral: true
        });
      }

      // Fetch username
      const targetUser = await client.users.fetch(userId).catch(() => null);
      if (!targetUser) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription('❌ Could not find that user. Double check the ID.')
          ],
          ephemeral: true
        });
      }

      // Save to DB
      await Blacklist.create({
        userId,
        username: targetUser.tag,
        reason,
        blacklistedBy: interaction.user.tag
      });

      // Kick if in server
      const guild = interaction.guild;
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) await member.kick(`Blacklisted: ${reason}`);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🚫 User Blacklisted')
            .addFields(
              { name: 'User', value: `${targetUser.tag} (<@${userId}>)`, inline: true },
              { name: 'Reason', value: reason, inline: true },
              { name: 'Blacklisted By', value: interaction.user.tag, inline: true }
            )
            .setTimestamp()
        ]
      });
    }

    // =========================
    // /blacklist remove
    // =========================
    if (sub === 'remove') {
      const userId = interaction.options.getString('userid');

      const entry = await Blacklist.findOneAndDelete({ userId });
      if (!entry) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription('❌ That user is not blacklisted.')
          ],
          ephemeral: true
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ User Removed from Blacklist')
            .addFields(
              { name: 'User', value: `${entry.username} (<@${userId}>)`, inline: true },
              { name: 'Removed By', value: interaction.user.tag, inline: true }
            )
            .setTimestamp()
        ]
      });
    }

    // =========================
    // /blacklist list
    // =========================
    if (sub === 'list') {
      const entries = await Blacklist.find();

      if (entries.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x00FF00)
              .setDescription('✅ The blacklist is currently empty.')
          ],
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🚫 Blacklist')
        .setDescription(`${entries.length} user(s) blacklisted`)
        .setTimestamp();

      for (const entry of entries) {
        embed.addFields({
          name: `${entry.username}`,
          value: `**ID:** ${entry.userId}\n**Reason:** ${entry.reason}\n**By:** ${entry.blacklistedBy}\n**Date:** <t:${Math.floor(new Date(entry.blacklistedAt).getTime() / 1000)}:D>`,
          inline: true
        });
      }

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  });

  // =========================
  // REJOIN CHECK
  // =========================
  client.on('guildMemberAdd', async (member) => {
    const entry = await Blacklist.findOne({ userId: member.id });
    if (!entry) return;

    const banDays = config.BLACKLIST_BAN_DAYS;
    const unixExpiry = Math.floor((Date.now() + banDays * 24 * 60 * 60 * 1000) / 1000);

    await member.send(
      `You have been banned from this server as you are blacklisted.\nReason: ${entry.reason}\nBan expires: <t:${unixExpiry}:F>`
    ).catch(() => null); // Don't crash if DMs are closed

    await member.ban({
      reason: `Blacklisted: ${entry.reason}`,
      deleteMessageSeconds: 0
    });

    const logChannel = member.guild.channels.cache.get(config.LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔨 Blacklisted User Banned on Rejoin')
            .addFields(
              { name: 'User', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
              { name: 'Reason', value: entry.reason, inline: true },
              { name: 'Ban Expires', value: `<t:${unixExpiry}:F>`, inline: true }
            )
            .setTimestamp()
        ]
      });
    }
  });

};