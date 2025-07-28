const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../../../config/config');

module.exports = {
  customId: 'add_permission_user',
  async execute(interaction) {
    if (interaction.user.id !== config.ownerId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Apenas o proprietário do bot pode interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const permissoesPath = path.join(__dirname, '../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        permissoesData = {};
      }
    }
    const guildId = interaction.guild.id;
    const users = permissoesData[guildId]?.users || [];
    if (users.length >= 25) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('O limite de 25 usuários com permissão já foi atingido. Remova algum usuário antes de adicionar outro.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`add_permission_user_modal_${interaction.user.id}`)
      .setTitle('Adicionar Usuário(s) à Permissão');

    const userIdInput = new TextInputBuilder()
      .setCustomId('user_ids')
      .setLabel('IDs (ou apenas um) separados por vírgula')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 1234567890,9876543210')
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(userIdInput);

    modal.addComponents(row);

    await interaction.showModal(modal);
  },
}