const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^admin_logs_app_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_logs_app_(\d+)$/);
    if (!match) return;

    const userId = match[1];

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para interagir com este botão.',
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`admin_logs_modal_${userId}`)
      .setTitle('Consultar Logs da Aplicação')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('app_id')
            .setLabel('App ID da aplicação')
            .setPlaceholder('Digite o APP-ID da aplicação')
            .setStyle(TextInputStyle.Short)
            .setMinLength(10)
            .setMaxLength(40)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }
};