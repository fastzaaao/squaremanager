const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: 'delete_status',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    if (interaction.user.id !== userId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const colorFilePath = path.join(__dirname, '../../../data/color.json');

    let colorData = {};
    if (fs.existsSync(colorFilePath)) {
      try {
        const fileContent = fs.readFileSync(colorFilePath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo color.json:', error);
      }
    }

    const statusesFilePath = path.join(__dirname, '../../../data/statuses.json');

    let statusesData = {};
    if (fs.existsSync(statusesFilePath)) {
      try {
        const fileContent = fs.readFileSync(statusesFilePath, 'utf8');
        statusesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo statuses.json:', error);
      }
    }

    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const currentStatuses = statusesData[guildId] || {};

    const selectMenuOptions = Object.entries(currentStatuses).map(([key, value]) => ({
      label: value,
      description: `Deletar o status: ${value}`,
      value: key,
      emoji: getEmoji(emojis.folha, '📄'),
    }));

    if (selectMenuOptions.length === 0) {
      const noStatusEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Não há status configurados para deletar.');

      return interaction.reply({
        embeds: [noStatusEmbed],
        flags: 64,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        '# Deletar Algum Status ❌',
        'Selecione um status no menu abaixo para deletá-lo.',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`delete_status_select_${userId}`)
      .setPlaceholder('Selecione um status para deletar')
      .addOptions(selectMenuOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
}