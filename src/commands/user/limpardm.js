const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpardm')
    .setDescription('Limpa as mensagens que o bot enviou na sua DM.'),

  async execute(interaction) {
    await interaction.reply({ content: 'Limpando suas DMs...', flags: 64 });

    try {
      const user = interaction.user;
      const dmChannel = await user.createDM();

      const messages = await dmChannel.messages.fetch({ limit: 100 });

      const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id && msg.deletable);

      let deleted = 0;
      for (const msg of botMessages.values()) {
        try {
          await msg.delete();
          deleted++;
        } catch {}
      }

      await interaction.followUp({
        content: `Foram apagadas ${deleted} mensagem(ns) do bot na sua DM.`,
        flags: 64
      });
    } catch (err) {
      await interaction.followUp({
        content: 'Não foi possível limpar suas DMs. Verifique se você tem mensagens do bot e se a DM está aberta.',
        flags: 64
      });
    }
    }
};