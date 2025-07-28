const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const config = require('../../../../../config/config');

module.exports = {
  customId: /^definir_apikey_squarecloud_\d+$/,
  async execute(interaction) {
    const userId = interaction.customId.split('_')[3];
    const permissoesPath = path.join(__dirname, '../../../../../data/permissoes.json');
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
      .setCustomId(`modal_apikey_squarecloud_${interaction.user.id}`)
      .setTitle('Definir API Key SquareCloud');

    const apiKeyInput = new TextInputBuilder()
      .setCustomId('apikey_input')
      .setLabel('API Key')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Insira sua API Key da SquareCloud')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(apiKeyInput);
    modal.addComponents(row);
    await interaction.showModal(modal);
  },
}