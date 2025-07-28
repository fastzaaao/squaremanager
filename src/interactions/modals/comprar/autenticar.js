const fs = require('fs');
const path = require('path');
const axios = require('axios');
const JSZip = require('jszip');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');
const { SquareCloudAPI } = require('@squarecloud/api');

module.exports = {
  customId: /^modal_autenticar_(.+)_\d+$/,
  async execute(interaction) {
    try {
      if (interaction.message && interaction.message.editable) {
        const newRows = interaction.message.components.map(row => {
          const newRow = new ActionRowBuilder();
          row.components.forEach(btn => {
            if (btn.customId && btn.customId.startsWith('autenticar_bot_')) {
              newRow.addComponents(ButtonBuilder.from(btn).setDisabled(true));
            } else {
              newRow.addComponents(ButtonBuilder.from(btn));
            }
          });
          return newRow;
        });
        await interaction.message.edit({ components: newRows });
      }
    } catch (e) {}

    const produto = interaction.customId.replace(/^modal_autenticar_/, '').replace(/_\d+$/, '');
    const userId = interaction.user.id;

    const nomeApp = interaction.fields.getTextInputValue('nome_app').trim();
    const tokenBot = interaction.fields.getTextInputValue('token_bot').trim();
    
    const applicationsPath = path.join(__dirname, '../../../data/applications.json');
    const produtosPath = path.join(__dirname, '../../../data/produtos.json');
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const colorPath = path.join(__dirname, '../../../data/color.json');
    const apisPath = path.join(__dirname, '../../../data/apis.json');
    const autoPath = path.join(__dirname, '../../../data/auto.json');
    const sourceDir = path.join(__dirname, '../../../source');
    const clientDir = path.join(sourceDir, 'client');
    if (!fs.existsSync(clientDir)) fs.mkdirSync(clientDir, { recursive: true });
    const globalZipPath = path.join(sourceDir, `${produto}.zip`);

    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    let autoData = {};
    if (fs.existsSync(autoPath)) {
      try {
        const fileContent = fs.readFileSync(autoPath, 'utf8');
        autoData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        autoData = {};
      }
    }

    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;

    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }
    const app = produtosData[produto];
    const embedColor = app?.preco?.embed?.cor === 'Default'
      ? (colorData[guildId] || '#808080')
      : (app?.preco?.embed?.cor || colorData[guildId] || '#808080');

    let squareApiKey = null;
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }

    const processingEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription(`# Sua aplicação está sendo autenticada. Aguarde alguns instantes... ${getEmoji(emojis.carregando, '⏳')}`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({
      embeds: [processingEmbed]
    });

    let applicationsData = {};
    if (fs.existsSync(applicationsPath)) {
      try {
        const fileContent = fs.readFileSync(applicationsPath, 'utf8');
        applicationsData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        applicationsData = {};
      }
    }

    let botId = null;
    let botResponse;
    try {
      botResponse = await axios.get("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${tokenBot}` }
      });
      botId = botResponse.data.id;
    } catch {
      try {
        if (interaction.message && interaction.message.editable) {
          const newRows = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(btn => {
              if (btn.customId && btn.customId.startsWith('autenticar_bot_')) {
                newRow.addComponents(ButtonBuilder.from(btn).setDisabled(false));
              } else {
                newRow.addComponents(ButtonBuilder.from(btn));
              }
            });
            return newRow;
          });
          await interaction.message.edit({ components: newRows });
        }
      } catch {}
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`# Token do bot inválido! Verifique e tente novamente. ${getEmoji(emojis.negative, '❌')} `)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    if (!fs.existsSync(globalZipPath)) {
      try {
        if (interaction.message && interaction.message.editable) {
          const newRows = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(btn => {
              if (btn.customId && btn.customId.startsWith('autenticar_bot_')) {
                newRow.addComponents(ButtonBuilder.from(btn).setDisabled(false));
              } else {
                newRow.addComponents(ButtonBuilder.from(btn));
              }
            });
            return newRow;
          });
          await interaction.message.edit({ components: newRows });
        }
      } catch {}
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`# Token do bot inválido! Verifique e tente novamente. ${getEmoji(emojis.negative, '❌')} `)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    const tempClientZipPath = path.join(clientDir, `${nomeApp}.zip`);
    fs.copyFileSync(globalZipPath, tempClientZipPath);

    try {
      const zipData = fs.readFileSync(tempClientZipPath);
      const zip = await JSZip.loadAsync(zipData);

      if (zip.file('config.json')) {
        let configJson = {};
        try {
          configJson = JSON.parse(await zip.file('config.json').async('string'));
        } catch {}
        configJson.token = tokenBot;
        configJson.owner = userId;
        configJson.botid = botId;
        configJson.CLIENT_ID = botId;
        configJson.EXPIRATION = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        zip.file('config.json', JSON.stringify(configJson, null, 2));
      }

      if (zip.file('.env')) {
        let envContent = await zip.file('.env').async('string');
        envContent = envContent
          .replace(/TOKEN=.*/g, `TOKEN=${tokenBot}`)
          .replace(/OWNER=.*/g, `OWNER=${userId}`)
          .replace(/botid=.*/g, `botid=${botId}`)
          .replace(/CLIENT_ID=.*/g, `CLIENT_ID=${botId}`)
          .replace(/EXPIRATION=.*/g, `EXPIRATION=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}`);
        zip.file('.env', envContent);
      }

      const configFileName = zip.file('squarecloud.config') ? 'squarecloud.config' : (zip.file('squarecloud.app') ? 'squarecloud.app' : null);
      if (configFileName) {
        let configContent = await zip.file(configFileName).async('string');
        const planoFormatado = produto.toLowerCase().replace(/\s+/g, '-');
        const usernameFormatado = interaction.member.displayName.toLowerCase().replace(/\s+/g, '-');
        const displayNameFinal = `${usernameFormatado}-${planoFormatado}`;
        configContent = configContent
          .replace(/^DISPLAY_NAME=.*$/m, `DISPLAY_NAME=${displayNameFinal}`)
          .replace(/^DESCRIPTION=.*$/m, `DESCRIPTION=${interaction.user.id}`);
        zip.file(configFileName, configContent);
      }

      const newZipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      fs.writeFileSync(tempClientZipPath, newZipBuffer);
    } catch (err) {
      try {
        if (interaction.message && interaction.message.editable) {
          const newRows = interaction.message.components.map(row => {
            const newRow = new ActionRowBuilder();
            row.components.forEach(btn => {
              if (btn.customId && btn.customId.startsWith('autenticar_bot_')) {
                newRow.addComponents(ButtonBuilder.from(btn).setDisabled(false));
              } else {
                newRow.addComponents(ButtonBuilder.from(btn));
              }
            });
            return newRow;
          });
          await interaction.message.edit({ components: newRows });
        }
      } catch {}
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`# Token do bot inválido! Verifique e tente novamente. ${getEmoji(emojis.negative, '❌')} `)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
      return interaction.editReply({ embeds: [embed] });
    }

    let deployData = null;
    if (squareApiKey) {
      try {
        const api1 = new SquareCloudAPI(squareApiKey);
        deployData = await api1.applications.create(tempClientZipPath);
      } catch (err) {
        try {
          if (interaction.message && interaction.message.editable) {
            const newRows = interaction.message.components.map(row => {
              const newRow = new ActionRowBuilder();
              row.components.forEach(btn => {
                if (btn.customId && btn.customId.startsWith('autenticar_bot_')) {
                  newRow.addComponents(ButtonBuilder.from(btn).setDisabled(false));
                } else {
                  newRow.addComponents(ButtonBuilder.from(btn));
                }
              });
              return newRow;
            });
            await interaction.message.edit({ components: newRows });
          }
        } catch {}
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`# Token do bot inválido! Verifique e tente novamente. ${getEmoji(emojis.negative, '❌')} `)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
        return interaction.editReply({ embeds: [embed] });
      }
    }

    const squareAppId = deployData?.id || null;

    const nomeAppSanitizado = nomeApp.replace(/[^\w\-]/g, '_');
    const clientZipFileName = `${nomeAppSanitizado}_${squareAppId}.zip`;
    const clientZipPath = path.join(clientDir, clientZipFileName);

    fs.renameSync(tempClientZipPath, clientZipPath);

    const dias = 30;
    function getDataExpiracaoDate() {
      const agora = new Date();
      agora.setDate(agora.getDate() + dias);
      return agora;
    }
    const dataExpiracaoDate = getDataExpiracaoDate();
    const timestamp = Math.floor(dataExpiracaoDate.getTime() / 1000);
    function getDataExpiracaoBrasilISO() {
      const agora = new Date();
      agora.setHours(agora.getHours() - 3);
      agora.setDate(agora.getDate() + 30);
      return agora.toISOString();
    }

    if (!autoData[userId]) autoData[userId] = { bots: [] };
    autoData[userId].bots.push({
      produto,
      nomeApp,
      botId,
      tokenBot,
      plano: produto,
      dias,
      dataExpiracao: getDataExpiracaoBrasilISO(),
      arquivo: `client/${clientZipFileName}`,
      squareAppId: squareAppId
    });
    fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2), 'utf8');

    if (squareAppId) {
      applicationsData[squareAppId] = {
        owner: userId,
        produto,
        nomeApp,
        botId,
        tokenBot,
        plano: produto,
        dataExpiracao: getDataExpiracaoBrasilISO(),
        arquivo: `client/${clientZipFileName}`,
        squareAppId
      };
      fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2), 'utf8');
    }

    try {
      const configPath = path.join(__dirname, '../../../data/config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const logsChannelId = config.logs;
      const logsChannel = await interaction.guild.channels.fetch(logsChannelId).catch(() => null);

      if (logsChannel && logsChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Nova aplicação autenticada ${getEmoji(emojis.certo, '✅')} `,
            `- Usuário: <@${userId}> (\`${userId}\`)`,
            `- Produto: \`${produto}\``,
            `- Nome do App: \`${nomeApp}\``,
            `- Bot ID: \`${botId}\``,
            `- App-ID: \`${squareAppId}\``,
            `- Data: <t:${Math.floor(Date.now() / 1000)}:f>`
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

        await logsChannel.send({ embeds: [logEmbed] });
      }
    } catch {}

    try {
      if (interaction.message && interaction.message.deletable) {
        await interaction.message.delete();
      }
    } catch {}

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('OAuth2')
        .setStyle(ButtonStyle.Link)
        .setEmoji(getEmoji(emojis.code, '🔗'))
        .setURL(`https://discord.com/oauth2/authorize?client_id=${botId}&permissions=8&scope=bot%20applications.commands`),
      new ButtonBuilder()
        .setCustomId(`sair_carrinho_${produto}_${userId}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(getEmoji(emojis.porta, '🚪')),
    );

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .addFields(
        { name: 'Produto', value: `\`\`\`${produto}\`\`\``, inline: true },
        { name: 'Nome do App', value: `\`\`\`${nomeApp}\`\`\``, inline: true },
        { name: 'Bot ID', value: `\`\`\`${botId}\`\`\``, inline: true },
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`# Aplicação autenticada com sucesso! ${getEmoji(emojis.certo, '✅')}\nUtilize /apps para gerenciar suas aplicações. Este carrinho será fechado em 10 minutos.\n-# Sua aplicação irá expirar <t:${timestamp}:R>.\n`);

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
    setTimeout(async () => {
      try {
        if (interaction.channel && interaction.channel.isThread()) {
          await interaction.channel.delete();
        }
      } catch {}
    }, 10 * 60 * 1000);
  },
};