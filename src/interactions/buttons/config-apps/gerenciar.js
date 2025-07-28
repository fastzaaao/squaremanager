const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^gerenciar_apps_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^gerenciar_apps_(\d+)$/);
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
        `# Gerenciamento de Aplicações ${getEmoji(emojis.engrenagem, '⚙️')}`,
        '-# Escolha uma das opções abaixo para gerenciar ou deletar uma aplicação.'
      ].join('\n\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin_gerenciar_apps_${userId}`)
        .setLabel('Gerenciamento')
        .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`admin_deletar_apps_${userId}`)
        .setLabel('Deletar Aplicação')
        .setEmoji(getEmoji(emojis.lixo, '🗑️'))
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64
    });
  }
};