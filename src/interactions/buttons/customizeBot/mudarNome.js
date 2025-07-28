const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'change_name',
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
      .setCustomId('change_name_modal')
      .setTitle('Alterar Nome do Bot');

    const nameInput = new TextInputBuilder()
      .setCustomId('bot_name')
      .setLabel('Insira o novo nome (máx. 32 caracteres)')
      .setPlaceholder('Digite o novo nome aqui...')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(32)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(nameInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};