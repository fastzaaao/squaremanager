const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../../utils/getEmoji');
const config = require('../../../../config/config');

module.exports = {
  customId: /^manager_squarecloud_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    const permissoesPath = path.join(__dirname, '../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler permissoes.json:', error);
      }
    }
    const guildId = interaction.guild.id;
    const usersPermitidos = permissoesData[guildId]?.users || [];
    const isOwner = interaction.user.id === config.ownerId;
    const isPermitido = usersPermitidos.includes(interaction.user.id);

    if (!isOwner && !isPermitido) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const colorPath = path.join(__dirname, '../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const apisPath = path.join(__dirname, '../../../../data/apis.json');
    let apisData = {};
    if (fs.existsSync(apisPath)) {
      try {
        const fileContent = fs.readFileSync(apisPath, 'utf8');
        apisData = JSON.parse(fileContent || '{}');
      } catch (error) {
        apisData = {};
      }
    }
    const apiKey = apisData.square;

    let userInfo = null;
    let erroApi = false;

    if (apiKey) {
      try {
        const url = 'https://api.squarecloud.app/v2/users/me';
        const options = {
          method: 'GET',
          headers: { Authorization: apiKey }
        };
        const response = await fetch(url, options);
        const data = await response.json();
        if (data.status === 'success') {
          userInfo = data.response;
        } else {
          erroApi = true;
        }
      } catch (err) {
        erroApi = true;
      }
    }

    let embed;
    if (!apiKey) {
      embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# SquareCloud ${getEmoji(emojis.squarecloud, '🟦')}`,
          '-# Configure sua integração com a SquareCloud.',
          '-# Defina sua API Key para utilizar os recursos.',
          '',
          `${getEmoji(emojis.erro, '❌')} Nenhuma API Key configurada!`
        ].join('\n'))
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
    } else if (erroApi || !userInfo) {
      embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# SquareCloud ${getEmoji(emojis.squarecloud, '🟦')}`,
          '-# Não foi possível obter informações da conta SquareCloud.',
          '-# Verifique se a API Key está correta.',
          '',
        ].join('\n'))
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
    } else {
      const user = userInfo.user;
      const plan = user.plan;
      const ramLimit = plan.memory.limit;
      const ramUsed = plan.memory.used;
      const planName = plan.name;
      const planExpire = plan.duration;
      const email = user.email;
      const name = user.name;
      const appsCount = Array.isArray(userInfo.applications) ? userInfo.applications.length : 0;

      embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# SquareCloud ${getEmoji(emojis.squarecloud, '🟦')}`,
          '-# Informações da sua conta SquareCloud:',
          '',
        ].join('\n'))
        .addFields(
          { name: `${getEmoji(emojis.usuario, '👤')} Nome`, value: `\`${name}\``, inline: true },
          { name: `${getEmoji(emojis.earth, '🌍')} Email`, value: `\`${email}\``, inline: true },
          { name: `${getEmoji(emojis.currency, '💰')} Plano`, value: `\`${planName}\``, inline: true },
          { name: `${getEmoji(emojis.foguete, '🚀')} RAM`, value: `\`${ramUsed}MB / ${ramLimit}MB\``, inline: true },
          { name: `${getEmoji(emojis.robo, '🤖')} Aplicações`, value: `\`${appsCount}\``, inline: true },
          { name: `${getEmoji(emojis.data, '📅')} Expira em`, value: `<t:${Math.floor(planExpire / 1000)}:F>`, inline: true },
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
    }

    const apiKeyButton = new ButtonBuilder()
      .setCustomId(`definir_apikey_squarecloud_${interaction.user.id}`)
      .setLabel('Definir Api Key')
      .setEmoji(getEmoji(emojis.key, '🔑'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_definicoes_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(apiKeyButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
}