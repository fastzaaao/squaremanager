const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'define_status',
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
      .setCustomId('define_status_modal')
      .setTitle('Definir Novos Status do Bot');

    const statusInput = new TextInputBuilder()
      .setCustomId('bot_statuses')
      .setLabel('Digite até 5 status separados por |')
      .setPlaceholder('Ex: Status 1 | Status 2 | Status 3')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(200)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(statusInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};