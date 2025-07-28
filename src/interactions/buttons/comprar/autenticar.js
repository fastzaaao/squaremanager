const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^autenticar_bot_(.+)_(\d+)$/,
  async execute(interaction) {
    const produto = interaction.customId.replace(/^autenticar_bot_/, '').replace(/_\d+$/, '');
    const userId = interaction.customId.match(/^autenticar_bot_.+_(\d+)$/)?.[1];

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
      .setCustomId(`modal_autenticar_${produto}_${interaction.user.id}`)
      .setTitle('Autenticar Bot');

    const nomeAppInput = new TextInputBuilder()
      .setCustomId('nome_app')
      .setLabel('Qual o nome do app?')
      .setStyle(TextInputStyle.Short)
      .setMinLength(3)
      .setMaxLength(20)
      .setPlaceholder('Ex: Vendas / Ticket / OAuth2')
      .setRequired(true);

    const tokenInput = new TextInputBuilder()
      .setCustomId('token_bot')
      .setLabel('Qual o token do bot?')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Cole aqui o token do bot')
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nomeAppInput),
      new ActionRowBuilder().addComponents(tokenInput)
    );

    await interaction.showModal(modal);
  }
}