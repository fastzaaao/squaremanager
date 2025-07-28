const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../config/config');

module.exports = {
  customId: /^remove_app_\d+$/,
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
    const modal = new ModalBuilder()
      .setCustomId('modal_remove_app')
      .setTitle('Remover App');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome_app_remover_input')
      .setLabel('Qual nome do app que deseja remover?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Vendas / Ticket / OAuth2')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(nomeInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  }
};