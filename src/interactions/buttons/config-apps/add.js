const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../config/config');

module.exports = {
  customId: /^add_app_\d+$/,
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
      .setCustomId(`modal_add_app_${interaction.user.id}`)
      .setTitle('Adicionar Novo App');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome_app_input')
      .setLabel('Nome do App')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Vendas / Ticket / OAuth2')
      .setRequired(true);

    const arquivoInput = new TextInputBuilder()
      .setCustomId('arquivo_app_input')
      .setLabel('Arquivo Principal')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: index.js / main.js / src/index.js')
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(nomeInput);
    const row2 = new ActionRowBuilder().addComponents(arquivoInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  },
}