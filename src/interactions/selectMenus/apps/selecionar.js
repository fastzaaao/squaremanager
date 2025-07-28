const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { SquareCloudAPI } = require('@squarecloud/api');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^apps_select_(\d+)$/, 
  async execute(interaction) {
    const match = interaction.customId.match(/^apps_select_(\d+)$/);
    if (!match || interaction.user.id !== match[1]) {
      return interaction.reply({
        content: `Você não tem permissão para interagir com este menu.`,
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

    const userId = interaction.user.id;
    const selectedId = interaction.values[0];
    const userApps = autoData[userId]?.bots || [];
    const bot = userApps.find(b => b.squareAppId === selectedId || b.nomeApp === selectedId);

    if (!bot) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${getEmoji(emojis.negative, '❌')} | Aplicação não encontrada.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        components: [],
        flags: 64
      });
    }

    let status = { status: 'offline', uptimeTimestamp: undefined };
    let application = null;
    try {
      const apisPath = path.join(__dirname, '../../../data/apis.json');
      let squareApiKey = null;
      if (fs.existsSync(apisPath)) {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      }
      if (squareApiKey && bot.squareAppId) {
        const api1 = new SquareCloudAPI(squareApiKey);
        application = await api1.applications.get(bot.squareAppId);
        status = await application.getStatus();
      }
    } catch {}

    let botUserId = bot.botId;
    try {
      if (bot.tokenBot) {
        const response = await axios.get("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bot ${bot.tokenBot}` }
        });
        botUserId = response.data.id;
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

    const selectMenu = new ActionRowBuilder().addComponents(
      interaction.component 
    );

    await interaction.update({
      content: '',
      embeds: [detalhes],
      components: [selectMenu, row1, row2],
      flags: 64
    });
  }
};