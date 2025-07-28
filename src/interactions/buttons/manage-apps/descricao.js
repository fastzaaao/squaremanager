const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../config/config');

module.exports = {
  customId: /^personalizar_desc_(.+)_\d+$/,
  async execute(interaction) {
    const permissoesPath = path.join(__dirname, '../../../data/permissoes.json');
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
    const produto = interaction.customId.replace(/^personalizar_desc_/, '').replace(/_\d+$/, '');

    const modal = new ModalBuilder()
      .setCustomId(`modal_desc_${produto}_${interaction.user.id}`)
      .setTitle('Personalizar Descrição da Embed');

    const descInput = new TextInputBuilder()
      .setCustomId('nova_descricao')
      .setLabel('Nova descrição da embed')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Digite a nova descrição...')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(descInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};