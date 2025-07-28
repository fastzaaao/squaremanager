const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'change_color',
  async execute(interaction) {
    const userId = interaction.customId.split('_')[2];

    if (interaction.user.id !== userId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('change_color_modal')
      .setTitle('Alterar Cor das Embeds');

    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('Insira o código hex da cor (ex: #FF0000)')
      .setPlaceholder('#FF0000')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(7)
      .setMinLength(7) 
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(colorInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};