const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../../../../config/config');

module.exports = {
  customId: /^definir_pix_\d+$/,
  async execute(interaction) {
    const userId = interaction.customId.split('_')[2];

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
      .setCustomId(`modal_definir_pix_${interaction.user.id}`)
      .setTitle('Definir Chave PIX');

    const chaveInput = new TextInputBuilder()
      .setCustomId('chave_pix_input')
      .setLabel('Chave PIX')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Digite sua chave PIX')
      .setRequired(true);

    const tipoInput = new TextInputBuilder()
      .setCustomId('tipo_pix_input')
      .setLabel('Tipo da Chave PIX (Email / Telefone / CPF)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Email')
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(chaveInput);
    const row2 = new ActionRowBuilder().addComponents(tipoInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  },
}