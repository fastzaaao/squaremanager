const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../../../../config/config');

module.exports = {
  customId: /^definir_chave_mp_\d+$/,
  async execute(interaction) {
    const userId = interaction.customId.split('_')[3];

    const permissoesPath = path.join(__dirname, '../../../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler permissoes.json:', error);
      }
    }
    const guildId = interaction.guild.id;
    const usersPermitidos = permissoesData[guildId]?.users || [];
    const isOwner = interaction.user.id === config.ownerId;
    const isPermitido = usersPermitidos.includes(interaction.user.id);

    if (!isOwner && !isPermitido) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`modal_definir_chave_mp_${interaction.user.id}`)
      .setTitle('Definir Chave Mercado Pago');

    const chaveInput = new TextInputBuilder()
      .setCustomId('chave_mp_input')
      .setLabel('Chave de Integração Mercado Pago')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite sua chave de integração')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(chaveInput);

    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};