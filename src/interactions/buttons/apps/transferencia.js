const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^confirmar_transferencia_(.+)_(\d+)_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^confirmar_transferencia_(.+)_(\d+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const oldOwnerId = match[2];
    const newOwnerId = match[3];

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

    if (interaction.user.id !== newOwnerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não pode confirmar esta transferência. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const autoPath = path.join(__dirname, '../../../data/auto.json');
    let autoData = {};
    if (fs.existsSync(autoPath)) {
      try {
        autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      } catch {
        autoData = {};
      }
    }

    let botObj = null;
    if (autoData[oldOwnerId] && Array.isArray(autoData[oldOwnerId].bots)) {
      const idx = autoData[oldOwnerId].bots.findIndex(b => b.squareAppId === squareAppId);
      if (idx !== -1) {
        botObj = autoData[oldOwnerId].bots[idx];
        autoData[oldOwnerId].bots.splice(idx, 1);
      }
    }

    if (botObj) {
      if (!autoData[newOwnerId]) autoData[newOwnerId] = { bots: [] };
      autoData[newOwnerId].bots.push(botObj);
    }

    const applicationsPath = path.join(__dirname, '../../../data/applications.json');
    let applicationsData = {};
    if (fs.existsSync(applicationsPath)) {
      try {
        applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
      } catch {
        applicationsData = {};
      }
    }
    if (applicationsData[squareAppId]) {
      applicationsData[squareAppId].owner = newOwnerId;
    }

    try {
      fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
      fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
    } catch {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Erro ao transferir a posse. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    let dmEnviada = true;
    try {
      const oldOwnerUser = await interaction.client.users.fetch(oldOwnerId);
      await oldOwnerUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Transferência concluída ${getEmoji(emojis.coroa, '👑')}`,
              `-# A posse da aplicação foi transferida para <@${newOwnerId}> com sucesso!`
            ].join('\n\n'))
        ]
      });
    } catch {
      dmEnviada = false;
    }

    return interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription([
            `# Transferência concluída ${getEmoji(emojis.coroa, '👑')}`,
            `-# Agora você é o novo dono da aplicação!`,
            !dmEnviada
              ? `-# ${getEmoji(emojis.negative, '❌')} Não foi possível enviar DM para o antigo dono.`
              : ''
          ].filter(Boolean).join('\n\n'))
      ],
      flags: 64,
      components: []
    });
  }
};