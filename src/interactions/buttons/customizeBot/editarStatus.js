const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: 'edit_status',
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

    let selectMenuOptions;
    let isMenuDisabled = false;

    if (Object.keys(currentStatuses).length === 0) {
      selectMenuOptions = [
        {
          label: 'Sem opções',
          description: 'Nenhum status configurado.',
          value: 'no_options',
        },
      ];
      isMenuDisabled = true;
    } else {
      selectMenuOptions = Object.entries(currentStatuses).map(([key, value]) => ({
        label: value,
        description: `Editar o status: ${value}`,
        value: key,
        emoji: getEmoji(emojis.folha, '📄'),
      }));
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        '# Editar Status Atuais ✏️',
        'Selecione um status no menu abaixo para editá-lo ou deletá-lo.',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`edit_status_select_${userId}`)
      .setPlaceholder('Selecione um status para editar')
      .addOptions(selectMenuOptions)
      .setDisabled(isMenuDisabled); 

    const deleteButton = new ButtonBuilder()
      .setCustomId(`delete_status_${userId}`)
      .setLabel('Deletar Algum Status')
      .setEmoji(getEmoji(emojis.lixo, '🗑️'))
      .setStyle(ButtonStyle.Danger)
      .setDisabled(isMenuDisabled); 

    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(deleteButton);

    await interaction.update({
      embeds: [embed],
      components: [row1, row2],
    });
  },
};