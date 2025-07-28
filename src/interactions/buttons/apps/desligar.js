const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { SquareCloudAPI } = require('@squarecloud/api');
const getEmoji = require('../../../utils/getEmoji');
const axios = require('axios');

module.exports = {
  customId: /^desligar_app_(.+)_(\d+)$/, 
  async execute(interaction) {
    await interaction.deferUpdate();
    const match = interaction.customId.match(/^desligar_app_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Você não tem permissão para interagir com este botão.`)
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
    const userApps = autoData[ownerId]?.bots || [];
    const bot = userApps.find(b => b.squareAppId === squareAppId);

    if (!bot) return;

    const apisPath = path.join(__dirname, '../../../data/apis.json');
    let squareApiKey = null;
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }

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
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    let botUserId = bot.botId;
    try {
      if (bot.tokenBot) {
        const response = await axios.get("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${bot.tokenBot}` }
        });
        botUserId = response.data.id;
      }
    } catch {}

    let status = { status: 'offline', uptimeTimestamp: undefined };
    try {
      if (squareApiKey && bot.squareAppId) {
        const api1 = new SquareCloudAPI(squareApiKey);
        const application = await api1.applications.get(bot.squareAppId);
        await application.stop();
        status = await application.getStatus();
      }
    } catch {}

    const dataObj = new Date(bot.dataExpiracao);
    dataObj.setHours(dataObj.getHours() + 3);
    const timestamp = Math.floor(dataObj.getTime() / 1000);

    const detalhes = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Detalhes da Aplicação ${getEmoji(emojis.caixa, '📦')}`,
        `-# Utilize os botões abaixo para gerenciar a aplicação selecionada.`,
      ].join('\n\n'))
      .addFields(
        { name: `${getEmoji(emojis.caixa, '📦')} Aplicação`, value: `\`${bot.nomeApp}\``, inline: true },
        { name: `${getEmoji(emojis.lapis, '✏️')} Meu Plano`, value: `\`${bot.plano} | ${bot.dias}d\``, inline: true },
        {
          name: `${getEmoji(emojis.lupa, '🔍')} Status`,
          value: status.status === 'running'
            ? `\`🟢 Online\``
            : `\`🔴 Offline\``,
          inline: true
        },
        { name: `${getEmoji(emojis.id, '🆔')} ID App`, value: `\`${bot.squareAppId || 'N/A'}\``, inline: true },
        {
          name: `${getEmoji(emojis.foguete, '🚀')} Uptime`,
          value: status.uptimeTimestamp === undefined
            ? `\`🔴 Bot está desligado.\``
            : `<t:${Math.floor(status.uptimeTimestamp / 1000)}:R>`,
          inline: true
        },
        { name: `${getEmoji(emojis.data, '📅')} Aluguel Termina`, value: `<t:${timestamp}:f> (<t:${timestamp}:R>)`, inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${status.status !== 'running' ? 'ligar_app' : 'desligar_app'}_${bot.squareAppId}_${interaction.user.id}`)
        .setLabel(status.status !== 'running' ? 'Ligar App' : 'Desligar App')
        .setEmoji(
          status.status !== 'running'
            ? getEmoji(emojis.on, '🟢')
            : getEmoji(emojis.off, '🔴')
        )
        .setStyle(status.status !== 'running' ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`reiniciar_app_${bot.squareAppId}_${interaction.user.id}`)
        .setLabel('Reiniciar Aplicação')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(getEmoji(emojis.menos, '🔄')),
      new ButtonBuilder()
        .setCustomId(`outras_app_${bot.squareAppId}_${interaction.user.id}`)
        .setLabel('Alterar diversos')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`renovar_app_${bot.produto}_${bot.squareAppId}_${interaction.user.id}`)
        .setLabel('Renovar App')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(getEmoji(emojis.money, '💰')),
      new ButtonBuilder()
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${botUserId}&permissions=8&scope=bot`)
        .setLabel('OAuth2')
        .setEmoji(getEmoji(emojis.code, '🔗'))
        .setStyle(ButtonStyle.Link)
    );

    const selectMenu = interaction.message.components[0];

    await interaction.editReply({
      content: '',
      embeds: [detalhes],
      components: [selectMenu, row1, row2],
      flags: 64
    });
  },
}