const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const getEmoji = require('../../../../../utils/getEmoji');

function validarApiKey(key) {
  return /^35a48cbe82d05d19ff7826848a84aace36131f66-[a-f0-9]{64}$/.test(key);
}

module.exports = {
  customId: /^modal_apikey_squarecloud_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const apiKey = interaction.fields.getTextInputValue('apikey_input').trim();

    if (!validarApiKey(apiKey)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${getEmoji(emojis.erro, '❌')} API Key inválida!`)
        ],
        flags: 64,
      });
    }

    const apisPath = path.join(__dirname, '../../../../../data/apis.json');
    let apisData = {};
    if (fs.existsSync(apisPath)) {
      try {
        const fileContent = fs.readFileSync(apisPath, 'utf8');
        apisData = JSON.parse(fileContent || '{}');
      } catch (error) {
        apisData = {};
      }
    }
    apisData.square = apiKey;

    try {
      fs.writeFileSync(apisPath, JSON.stringify(apisData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${getEmoji(emojis.erro, '❌')} Erro ao salvar a API Key.`)
        ],
        flags: 64,
      });
    }

    let userInfo = null;
    let erroApi = false;
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

    let embed;
    if (erroApi || !userInfo) {
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
      .setStyle('Secondary');

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_definicoes_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle('Secondary');

    const row = new ActionRowBuilder().addComponents(apiKeyButton, backButton);

    const messageId = interaction.message.id;
    const channel = interaction.channel;
    const originalMessage = await channel.messages.fetch(messageId);

    await originalMessage.edit({
      embeds: [embed],
      components: [row],
    });

    await interaction.deferUpdate();
  },
}