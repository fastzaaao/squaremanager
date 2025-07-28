const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'change_banner',
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
      .setCustomId('change_banner_modal')
      .setTitle('Alterar Banner do Bot');

    const bannerUrlInput = new TextInputBuilder()
      .setCustomId('banner_url')
      .setLabel('Insira o link da nova imagem do banner')
      .setPlaceholder('https://exemplo.com/banner.png')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(bannerUrlInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};