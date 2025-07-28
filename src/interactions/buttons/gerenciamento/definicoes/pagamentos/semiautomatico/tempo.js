const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  customId: /^tempo_pagar_\d+$/,
  async execute(interaction) {
    const userId = interaction.customId.split('_')[2];

    const permissoesPath = path.join(__dirname, '../../../../../../data/permissoes.json');
        let permissoesData = {};
        if (fs.existsSync(permissoesPath)) {
          try {
            const fileContent = fs.readFileSync(permissoesPath, 'utf8');
            permissoesData = JSON.parse(fileContent || '{}');
          } catch (error) {
            permissoesData = {};
          }
        }
        const configPath = path.join(__dirname, '../../../../../../config/config.js');
        const config = require(configPath);
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
      .setCustomId(`modal_tempo_pagar_${interaction.user.id}`)
      .setTitle('Definir Tempo para Pagar');

    const tempoInput = new TextInputBuilder()
      .setCustomId('tempo_pagar_input')
      .setLabel('Tempo para pagar (minutos, entre 5 e 59)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(1)
      .setMaxLength(2)
      .setPlaceholder('Ex: 15')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(tempoInput);
    modal.addComponents(row);  
    await interaction.showModal(modal);
  },
}