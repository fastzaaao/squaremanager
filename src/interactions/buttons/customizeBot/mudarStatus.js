const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: 'change_status',
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

    const currentStatuses = statusesData[guildId] && Object.keys(statusesData[guildId]).length > 0
      ? Object.values(statusesData[guildId]).map(status => `-# ${status}`).join('\n')
      : '**-# Você ainda não definiu nenhum status.**';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        '# Personalizar Status do Bot 💭',
        'Clique nos botões abaixo para definir ou editar os status do bot.',
        '',
        `**STATUS ATUAIS:**\n${currentStatuses}`,
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const defineStatusButton = new ButtonBuilder()
      .setCustomId(`define_status_${userId}`)
      .setLabel('Definir Novos Status')
      .setEmoji(getEmoji(emojis.folha, '📄'))
      .setStyle(ButtonStyle.Secondary);

    const editStatusButton = new ButtonBuilder()
      .setCustomId(`edit_status_${userId}`)
      .setLabel('Editar Status Atuais')
      .setEmoji(getEmoji(emojis.lapis, '✏️'))
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!statusesData[guildId] || Object.keys(statusesData[guildId]).length === 0);

    const row = new ActionRowBuilder().addComponents(defineStatusButton, editStatusButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
    });
  },
}