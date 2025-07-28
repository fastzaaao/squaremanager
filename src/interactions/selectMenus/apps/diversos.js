const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^alterar_app_(.+)_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^alterar_app_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: 'Você não tem permissão para alterar esta aplicação.',
        flags: 64
      });
    }

    const selected = interaction.values[0];

    if (selected === 'alterar_nome') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_nome_${squareAppId}_${ownerId}`)
        .setTitle('Alterar Nome da Aplicação')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('novo_nome')
              .setLabel('Novo nome da aplicação')
              .setStyle(TextInputStyle.Short)
              .setMinLength(2)
              .setMaxLength(32)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }

    if (selected === 'alterar_token') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_token_${squareAppId}_${ownerId}`)
        .setTitle('Alterar Token da Aplicação')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('novo_token')
              .setLabel('Novo token do bot')
              .setStyle(TextInputStyle.Short)
              .setMinLength(10)
              .setMaxLength(100)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }

    if (selected === 'transferir_posse') {
      const modal = new ModalBuilder()
        .setCustomId(`modal_transferir_${squareAppId}_${ownerId}`)
        .setTitle('Transferir Posse da Aplicação')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('novo_dono')
              .setLabel('ID do novo dono')
              .setStyle(TextInputStyle.Short)
              .setMinLength(17)
              .setMaxLength(20)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }
  }
};