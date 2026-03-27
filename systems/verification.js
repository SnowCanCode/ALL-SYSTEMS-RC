const config = require('../config/config');

module.exports = (client) => {

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      if (reaction.message.channel.id !== config.VERIFY_CHANNEL_ID) return;

      const guild = reaction.message.guild;
      const reactor = await guild.members.fetch(user.id);

      const isHR = config.HR_ROLE_IDS.some(roleId =>
        reactor.roles.cache.has(roleId)
      );
      if (!isHR) return;

     let target;
try {
  target = await guild.members.fetch(reaction.message.author.id);
} catch {
  return; // user not in server anymore
}
      const logChannel = guild.channels.cache.get(config.LOG_CHANNEL_ID);
      const unixTime = Math.floor(Date.now() / 1000);

      // =========================
      // VERIFY (✅)
      // =========================
      if (reaction.emoji.name === config.VERIFY_EMOJI) {

        // Prevent double verification
        const alreadyVerified = config.VERIFIED_ROLE_IDS.every(roleId =>
          target.roles.cache.has(roleId)
        );
        if (alreadyVerified) return;

        // Anti-alt check
        const accountAgeDays =
          (Date.now() - target.user.createdAt) / (1000 * 60 * 60 * 24);

        if (accountAgeDays < config.MIN_ACCOUNT_AGE_DAYS) {
          if (logChannel) {
            await logChannel.send(
              `Verification failed for ${target.user.tag} (account too new: ${accountAgeDays.toFixed(1)} days)`
            );
          }
          return;
        }

        // Add roles
        for (const roleId of config.VERIFIED_ROLE_IDS) {
          if (!target.roles.cache.has(roleId)) {
            await target.roles.add(roleId);
          }
        }

        // Remove unverified role
        if (target.roles.cache.has(config.UNVERIFIED_ROLE_ID)) {
          await target.roles.remove(config.UNVERIFIED_ROLE_ID);
        }

        console.log(`Verified ${target.user.tag} by ${reactor.user.tag}`);

        if (logChannel) {
          await logChannel.send(
            `Member: ${target.user.tag} was verified by ${reactor.user.tag} at <t:${unixTime}:F>`
          );
        }
      }

      // =========================
      // UNVERIFY (❌)
      // =========================
      if (reaction.emoji.name === config.UNVERIFY_EMOJI) {

        // Remove verified roles
        for (const roleId of config.VERIFIED_ROLE_IDS) {
          if (target.roles.cache.has(roleId)) {
            await target.roles.remove(roleId);
          }
        }

        // Add unverified role back
        if (!target.roles.cache.has(config.UNVERIFIED_ROLE_ID)) {
          await target.roles.add(config.UNVERIFIED_ROLE_ID);
        }

        console.log(`Unverified ${target.user.tag} by ${reactor.user.tag}`);

        if (logChannel) {
          await logChannel.send(
            `Member: ${target.user.tag} was unverified by ${reactor.user.tag} at <t:${unixTime}:F>`
          );
        }
      }

    } catch (error) {
      console.error("Error handling verification reaction:", error);
    }
  });

};
