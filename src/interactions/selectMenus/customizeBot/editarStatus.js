const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'edit_status_select',
  async execute(interaction) {
    const selectedStatusKey = interaction.values[0]; 
    const userId = interaction.customId.split('_')[3];

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para interagir com este menu.',
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`edit_status_modal_${selectedStatusKey}`)
      .setTitle('Editar Status');

    const statusInput = new TextInputBuilder()
      .setCustomId('new_status')
      .setLabel('Digite o novo status')
      .setPlaceholder('Insira o novo status aqui...')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(statusInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};