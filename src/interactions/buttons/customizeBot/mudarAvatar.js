const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  customId: 'change_avatar',
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
      .setCustomId('change_avatar_modal')
      .setTitle('Alterar Avatar do Bot');

    const avatarUrlInput = new TextInputBuilder()
      .setCustomId('avatar_url')
      .setLabel('Insira o link da nova imagem do avatar')
      .setPlaceholder('https://exemplo.com/avatar.png')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(avatarUrlInput);

    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },
};