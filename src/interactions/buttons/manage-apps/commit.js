const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../config/config');

module.exports = {
  customId: /^commit_produto_(.+)_\d+$/,
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
    const produto = interaction.customId.replace(/^commit_produto_/, '').replace(/_\d+$/, '');

    const modal = new ModalBuilder()
      .setCustomId(`modal_commit_${produto}_${interaction.user.id}`)
      .setTitle('Confirmação de Commit');

    const confirmInput = new TextInputBuilder()
      .setCustomId('confirm_commit')
      .setLabel('Digite "SIM" para prosseguir')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('SIM')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(confirmInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  },
}