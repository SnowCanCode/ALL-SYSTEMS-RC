const config = require('../config/config.js');

module.exports = (client) => {

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (!message.content.startsWith("!")) return;

    const args = message.content.split(" ");
    const command = args[0].toLowerCase();

    const member = await message.guild.members.fetch(message.author.id);

    const hasPermission = config.COMMAND_ROLE_IDS.some(roleId =>
      member.roles.cache.has(roleId)
    );
    if (!hasPermission) return;

    const logChannel = message.guild.channels.cache.get(config.LOG_CHANNEL_ID);
    const unixTime = Math.floor(Date.now() / 1000);

    // !setrank @user ROLE_ID
    if (command === "!setrank") {
      const target = message.mentions.members.first();
      const roleId = args[2];

      if (!target || !role) {
        return message.reply("Usage: !setrank @user ROLE_ID");
      }

      // Remove all rank roles
      for (const rankRole of config.RANK_ROLES) {
        if (target.roles.cache.has(rankRole)) {
          await target.roles.remove(rankRole);
        }
      }

      // Add new rank
      await target.roles.add(role.id);

      if (logChannel) {
        await logChannel.send(
          `Member: ${target.user.tag} was set to rank <@&${role.id}> by ${message.author.tag} at <t:${unixTime}:F>`
        );
      }

      message.reply(`Set ${target.user.tag} to new rank.`);
    }

  });

};
