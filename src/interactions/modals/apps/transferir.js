const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^modal_transferir_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^modal_transferir_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

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
          .setDescription(`# Processando transferência... ${getEmoji(emojis.carregando, '⏳')}`)
      ],
      flags: 64
    });

    if (interaction.user.id !== ownerId) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para transferir esta aplicação. ${getEmoji(emojis.negative, '❌')}`)
        ]
      });
    }

    const novoDonoId = interaction.fields.getTextInputValue('novo_dono').trim();

    let membro;
    try {
      membro = await interaction.guild.members.fetch(novoDonoId);
    } catch {
      membro = null;
    }

    if (!membro) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# O usuário informado não está no servidor ou não existe. ${getEmoji(emojis.negative, '❌')}`)
        ]
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
    const userBots = autoData[ownerId]?.bots || [];
    const bot = userBots.find(b => b.squareAppId === squareAppId);

    if (!bot) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Aplicação não encontrada. ${getEmoji(emojis.negative, '❌')}`)
        ]
      });
    }

    let dmEnviada = true;
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# Pedido de transferência de posse ${getEmoji(emojis.coroa, '👑')}`,
          `-# O usuário <@${ownerId}> deseja transferir a posse da aplicação \`${bot.nomeApp}\` para você.`,
          `-# Clique no botão abaixo para confirmar a transferência.`
        ].join('\n\n'))
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirmar_transferencia_${squareAppId}_${ownerId}_${novoDonoId}`)
          .setLabel('Aceitar transferência')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(getEmoji(emojis.coroa, '👑'))
      );

      await membro.send({ embeds: [dmEmbed], components: [row] });
    } catch {
      dmEnviada = false;
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription([
            `# Pedido de transferência enviado ${getEmoji(emojis.coroa, '👑')}`,
            `-# O usuário <@${novoDonoId}> foi notificado para aceitar a posse da aplicação.`,
            !dmEnviada
              ? `-# ${getEmoji(emojis.negative, '❌')} **Não foi possível enviar mensagem privada para o usuário. Ele precisa liberar o privado para aceitar a transferência.**`
              : ''
          ].filter(Boolean).join('\n\n'))
      ]
    });
  }
};