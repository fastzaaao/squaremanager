const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^admin_gerenciar_apps_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_gerenciar_apps_(\d+)$/);
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
            .setDescription(`# Você não tem permissão para interagir com este painel. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Painel de Gerenciamento ${getEmoji(emojis.engrenagem, '⚙️')}`,
        '-# Selecione uma ação para a aplicação abaixo.'
      ].join('\n\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`admin_select_gerenciar_apps_${userId}`)
      .setPlaceholder('Selecione uma ação')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Ligar App')
          .setValue('ligar_app')
          .setEmoji(getEmoji(emojis.on, '🟢')),
        new StringSelectMenuOptionBuilder()
          .setLabel('Reiniciar App')
          .setValue('reiniciar_app')
          .setEmoji(getEmoji(emojis.menos, '🔄')),
        new StringSelectMenuOptionBuilder()
          .setLabel('Desligar App')
          .setValue('desligar_app')
          .setEmoji(getEmoji(emojis.off, '🔴')),
        new StringSelectMenuOptionBuilder()
          .setLabel('Status App')
          .setValue('status_app')
          .setEmoji(getEmoji(emojis.lupa, '🔍'))
      );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`admin_logs_app_${userId}`)
        .setLabel('Logs')
        .setEmoji(getEmoji(emojis.code, '📄'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`return_apps_${userId}`)
        .setEmoji(getEmoji(emojis.seta, '⬅️'))
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.update({
      embeds: [embed],
      components: [rowSelect, rowButtons],
      flags: 64
    });
  }
};