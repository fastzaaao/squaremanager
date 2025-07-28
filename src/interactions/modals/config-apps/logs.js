const { EmbedBuilder } = require('discord.js');
const { SquareCloudAPI } = require('@squarecloud/api');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^admin_logs_modal_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_logs_modal_(\d+)$/);
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
            .setDescription(`# Você não tem permissão para consultar os logs. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const appId = interaction.fields.getTextInputValue('app_id').trim();

    const apisPath = path.join(__dirname, '../../../data/apis.json');
    let squareApiKey = null;
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }

    if (!squareApiKey) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# API Key da SquareCloud não configurada. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    let logs = null;
    try {
      const api = new SquareCloudAPI(squareApiKey);
      const app = await api.applications.get(appId);
      logs = await app.getLogs();
    } catch {
      logs = null;
    }

    if (!logs) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Não foi possível obter os logs da aplicação. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const logsPreview = logs.length > 4000 ? logs.slice(-4000) : logs;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Logs da Aplicação ${getEmoji(emojis.code, '💻')}`,
            '```ansi',
            logsPreview || 'Sem logs disponíveis.',
            '```'
          ].join('\n'))
      ],
      flags: 64
    });
  }
};