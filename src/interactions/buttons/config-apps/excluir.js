const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^admin_excluir_apps_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_excluir_apps_(\d+)$/);
    if (!match) return;

    const userId = match[1];

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para interagir com este botão.',
        flags: 64
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`admin_modal_excluir_${userId}`)
      .setTitle('Excluir Aplicação')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('id_info')
            .setLabel('ID do dono ou App-ID da aplicação')
            .setPlaceholder('Digite o ID do Discord do dono ou o App-ID')
            .setStyle(TextInputStyle.Short)
            .setMinLength(10)
            .setMaxLength(40)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  }
};