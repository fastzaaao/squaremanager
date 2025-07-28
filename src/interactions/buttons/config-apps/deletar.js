const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^admin_deletar_apps_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_deletar_apps_(\d+)$/);
    if (!match) return;

    const userId = match[1];

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild?.id;
    const embedColor = colorData[guildId] || '#808080';

    if (interaction.user.id !== userId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para interagir com este botão. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Excluir Aplicação ${getEmoji(emojis.lixo, '🗑️')}`,
        '-# Para excluir uma aplicação, informe o **ID do Discord do dono** ou o **App-ID da aplicação**.',
        '-# Clique no botão abaixo para informar e confirmar a exclusão.'
      ].join('\n\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin_excluir_apps_${userId}`)
        .setLabel('Excluir')
        .setEmoji(getEmoji(emojis.lixo, '🗑️'))
        .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
        .setCustomId(`return_apps_${userId}`)
        .setEmoji(getEmoji(emojis.seta, '⬅️'))
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.update({
      embeds: [embed],
      components: [row],
      flags: 64
    });
  }
};