const { EmbedBuilder } = require('discord.js');
const { SquareCloudAPI } = require('@squarecloud/api');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^(admin_modal_ligar_|admin_modal_reiniciar_|admin_modal_desligar_|admin_modal_status_|admin_logs_modal_)\d+$/,
  async execute(interaction) {
    const customId = interaction.customId;
    const userId = customId.replace(/^\D+(\d+)$/, '$1');

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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription(`# Processando a ação... ${getEmoji(emojis.carregando, '⏳')}`)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      flags: 64
    });

    if (interaction.user.id !== userId) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para esta ação. ${getEmoji(emojis.negative, '❌')}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ]
      });
    }

    const apisPath = path.join(__dirname, '../../../data/apis.json');
    let squareApiKey = null;
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }
    if (!squareApiKey) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# API Key da SquareCloud não configurada. ${getEmoji(emojis.negative, '❌')}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ]
      });
    }

    const appId = interaction.fields.getTextInputValue('app_id').trim();

    if (customId.startsWith('admin_modal_ligar_')) {
      let status = null;
      try {
        const api = new SquareCloudAPI(squareApiKey);
        const app = await api.applications.get(appId);
        await app.start();
        status = await app.getStatus();
      } catch {}
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setDescription([
              `# Aplicação ligada ${getEmoji(emojis.on, '🟢')}`,
              status && status.status === 'running'
                ? '-# O app foi iniciado com sucesso!'
                : '-# Não foi possível ligar a aplicação.'
            ].join('\n\n'))
        ]
      });
    }

    if (customId.startsWith('admin_modal_reiniciar_')) {
      let status = null;
      try {
        const api = new SquareCloudAPI(squareApiKey);
        const app = await api.applications.get(appId);
        await app.restart();
        status = await app.getStatus();
      } catch {}
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setDescription([
              `# Aplicação reiniciada ${getEmoji(emojis.menos, '🔄')}`,
              status && status.status === 'running'
                ? '-# O app foi reiniciado com sucesso!'
                : '-# Não foi possível reiniciar a aplicação.'
            ].join('\n\n'))
        ]
      });
    }

    if (customId.startsWith('admin_modal_desligar_')) {
      let status = null;
      try {
        const api = new SquareCloudAPI(squareApiKey);
        const app = await api.applications.get(appId);
        await app.stop();
        status = await app.getStatus();
      } catch {}
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setDescription([
              `# Aplicação desligada ${getEmoji(emojis.off, '🔴')}`,
              status && status.status !== 'running'
                ? '-# O app foi desligado com sucesso!'
                : '-# Não foi possível desligar a aplicação.'
            ].join('\n\n'))
        ]
      });
    }

    if (customId.startsWith('admin_modal_status_')) {
  let status = null;
  try {
    const api = new SquareCloudAPI(squareApiKey);
    const app = await api.applications.get(appId);
    status = await app.getStatus();
  } catch {}

  if (!status) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`# Não foi possível obter o status da aplicação. ${getEmoji(emojis.negative, '❌')}`)
      ]
    });
  }

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(embedColor)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setDescription([
          `# Status da Aplicação ${getEmoji(emojis.lupa, '🔍')}`,
          `-# Status: \`${status.status === 'running' ? '🟢 Online' : '🔴 Offline'}\``,
          `-# Rodando: \`${status.running ? 'Sim' : 'Não'}\``,
          `-# CPU: \`${status.usage?.cpu || 'N/A'}\``,
          `-# RAM: \`${status.usage?.ram || 'N/A'}\``,
          `-# Storage: \`${status.usage?.storage || 'N/A'}\``,
          `-# Network (total): \`${status.usage?.network?.total || 'N/A'}\``,
          `-# Network (agora): \`${status.usage?.network?.now || 'N/A'}\``
        ].join('\n\n'))
    ]
  });
}
  }
};