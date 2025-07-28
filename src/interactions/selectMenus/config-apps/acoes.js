const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: /^admin_select_gerenciar_apps_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_select_gerenciar_apps_(\d+)$/);
    if (!match) return;

    const userId = match[1];

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para interagir com este menu.',
        flags: 64
      });
    }

    const selected = interaction.values[0];

    let modal;
    if (selected === 'ligar_app') {
      modal = new ModalBuilder()
        .setCustomId(`admin_modal_ligar_${userId}`)
        .setTitle('Ligar Aplicação')
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
    } else if (selected === 'reiniciar_app') {
      modal = new ModalBuilder()
        .setCustomId(`admin_modal_reiniciar_${userId}`)
        .setTitle('Reiniciar Aplicação')
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
    } else if (selected === 'desligar_app') {
      modal = new ModalBuilder()
        .setCustomId(`admin_modal_desligar_${userId}`)
        .setTitle('Desligar Aplicação')
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
    } else if (selected === 'status_app') {
      modal = new ModalBuilder()
        .setCustomId(`admin_modal_status_${userId}`)
        .setTitle('Status da Aplicação')
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
    }

    if (modal) {
      await interaction.showModal(modal);
    }
  }
};