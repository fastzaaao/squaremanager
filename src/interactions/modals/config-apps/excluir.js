const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { SquareCloudAPI } = require('@squarecloud/api');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^admin_modal_excluir_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^admin_modal_excluir_(\d+)$/);
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

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription(`# Processando... ${getEmoji(emojis.carregando, '⏳')}`)
      ],
      flags: 64
    });

    if (interaction.user.id !== userId) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para esta ação. ${getEmoji(emojis.negative, '❌')}`)
        ]
      });
    }

    const idInfo = interaction.fields.getTextInputValue('id_info').trim();

    const autoPath = path.join(__dirname, '../../../data/auto.json');
    const applicationsPath = path.join(__dirname, '../../../data/applications.json');
    const apisPath = path.join(__dirname, '../../../data/apis.json');
    const configPath = path.join(__dirname, '../../../data/config.json');
    let autoData = {};
    let applicationsData = {};
    let squareApiKey = null;
    let logsChannelId = null;
    if (fs.existsSync(autoPath)) {
      try {
        autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      } catch {
        autoData = {};
      }
    }
    if (fs.existsSync(applicationsPath)) {
      try {
        applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
      } catch {
        applicationsData = {};
      }
    }
    if (fs.existsSync(apisPath)) {
      try {
        const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
        squareApiKey = apis.square;
      } catch {}
    }
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        logsChannelId = config.logs;
      } catch {}
    }

    async function deletarSquareCloud(appId) {
      if (!squareApiKey) return false;
      try {
        const api = new SquareCloudAPI(squareApiKey);
        const app = await api.applications.get(appId);
        await app.delete();
        return true;
      } catch {
        return false;
      }
    }

    async function getSnapshot(appId) {
      if (!squareApiKey) return null;
      try {
        const url = `https://api.squarecloud.app/v2/apps/${appId}/snapshots`;
        const response = await axios.post(url, undefined, {
          headers: { Authorization: squareApiKey }
        });
        const data = response.data;
        if (data.status === 'success' && data.response?.url) {
          return data.response.url;
        }
      } catch (err) {
        console.error('Erro ao requisitar snapshot:', err?.response?.data || err);
      }
      return null;
    }

    function apagarZip(arquivo) {
    if (!arquivo) return;
    const clientZipPath = path.join(__dirname, '../../../source', arquivo);
    if (fs.existsSync(clientZipPath)) {
      try {
        fs.unlinkSync(clientZipPath);
      } catch (err) {
        console.error(`Erro ao excluir zip do cliente: ${clientZipPath}`, err?.message || err);
      }
    }
  }

    async function avisarDono(owner, produto, nomeApp) {
      try {
        const user = await interaction.client.users.fetch(owner);
        if (user) {
          await user.send({
            embeds: [
              new EmbedBuilder()
                .setColor(embedColor)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription([
                  `# Sua aplicação foi excluída ${getEmoji(emojis.lixo, '🗑️')}`,
                  `-# Seu bot **${nomeApp || 'N/A'}** (${produto || 'N/A'}) foi removido do sistema.`,
                  '-# Se você acredita que isso foi um engano, entre em contato com o suporte.'
                ].join('\n'))
            ]
          });
        }
      } catch {}
    }

    async function enviarLogsESnapshot({ appId, owner, produto, nomeApp, botId, arquivo }) {
      if (!logsChannelId) return;
      const logsChannel = await interaction.guild.channels.fetch(logsChannelId).catch(() => null);
      if (!logsChannel || !logsChannel.isTextBased()) return;

      const snapshotUrl = await getSnapshot(appId);
      let snapshotAttachment = null;

      if (snapshotUrl) {
        try {
          const response = await axios.get(snapshotUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const backupsDir = path.join(__dirname, '../../../source/backups');
          if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
          const nomeAppSanitizado = (nomeApp || 'app').replace(/[^\w\-]/g, '_');
          const agora = new Date();
          agora.setHours(agora.getHours() - 3); 
          const dataStr = agora.toISOString().replace(/[:T]/g, '-').slice(0, 19);
          const backupFileName = `${nomeAppSanitizado}_${dataStr}.zip`;
          const backupPath = path.join(backupsDir, backupFileName);
          fs.writeFileSync(backupPath, buffer);
          snapshotAttachment = new AttachmentBuilder(buffer, { name: backupFileName });
        } catch (err) {
          console.error('Erro ao baixar snapshot:', err?.response?.data || err);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# Aplicação excluída ${getEmoji(emojis.lixo, '🗑️')}`,
          `- App-ID: \`${appId}\``,
          `- Produto: \`${produto || 'N/A'}\``,
          `- Nome do App: \`${nomeApp || 'N/A'}\``,
          `- Bot ID: \`${botId || 'N/A'}\``,
          `- Dono: <@${owner}> (\`${owner}\`)`,
          `- Data: <t:${Math.floor(Date.now() / 1000)}:f>`,
        ].join('\n'));

      await logsChannel.send({
        embeds: [embed],
        files: snapshotAttachment ? [snapshotAttachment] : []
      });
    }

    if (/^[a-f0-9]{32}$/i.test(idInfo)) {
      let found = false;
      let deletedSquare = false;
      let appInfo = null;
      if (applicationsData[idInfo]) {
        appInfo = applicationsData[idInfo];
        const owner = applicationsData[idInfo].owner;

        await enviarLogsESnapshot({
          appId: idInfo,
          owner,
          produto: appInfo.produto,
          nomeApp: appInfo.nomeApp,
          botId: appInfo.botId,
          arquivo: appInfo.arquivo
        });

        apagarZip(appInfo.arquivo);
        await avisarDono(owner, appInfo.produto, appInfo.nomeApp);

        delete applicationsData[idInfo];
        found = true;
        if (autoData[owner] && Array.isArray(autoData[owner].bots)) {
          autoData[owner].bots = autoData[owner].bots.filter(b => b.squareAppId !== idInfo);
        }
        deletedSquare = await deletarSquareCloud(idInfo);
      }

      if (found) {
        try {
          fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
          fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
        } catch {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`# Erro ao excluir a aplicação localmente. ${getEmoji(emojis.negative, '❌')}`)
            ]
          });
        }
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(embedColor)
              .setDescription([
                `# Aplicação excluída com sucesso ${getEmoji(emojis.lixo, '🗑️')}`,
                `-# O App-ID \`${idInfo}\` foi removido do sistema.`,
                deletedSquare
                  ? `-# Também foi excluída da SquareCloud.`
                  : `-# ${getEmoji(emojis.negative, '❌')} Não foi possível excluir da SquareCloud.`
              ].join('\n\n'))
          ]
        });
      } else {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription(`# Nenhuma aplicação encontrada com este App-ID. ${getEmoji(emojis.negative, '❌')}`)
          ]
        });
      }
    }

    if (/^\d{17,20}$/.test(idInfo)) {
      const bots = autoData[idInfo]?.bots || [];
      if (bots.length === 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription(`# Este usuário não possui bots registrados. ${getEmoji(emojis.negative, '❌')}`)
          ]
        });
      }

      if (bots.length > 1) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription([
                `# Este usuário possui mais de um bot ativo ${getEmoji(emojis.negative, '❌')}`,
                '-# Por favor, utilize o **App-ID** para excluir uma aplicação específica.'
              ].join('\n\n'))
          ]
        });
      }

      const bot = bots[0];
      let deletedSquare = false;

      await enviarLogsESnapshot({
        appId: bot.squareAppId,
        owner: idInfo,
        produto: bot.produto,
        nomeApp: bot.nomeApp,
        botId: bot.botId,
        arquivo: bot.arquivo
      });

      apagarZip(bot.arquivo);
      await avisarDono(idInfo, bot.produto, bot.nomeApp);

      if (applicationsData[bot.squareAppId]) {
        delete applicationsData[bot.squareAppId];
      }
      delete autoData[idInfo];
      deletedSquare = await deletarSquareCloud(bot.squareAppId);

      try {
        fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
        fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
      } catch {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setDescription(`# Erro ao excluir a aplicação localmente. ${getEmoji(emojis.negative, '❌')}`)
          ]
        });
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Aplicação excluída com sucesso ${getEmoji(emojis.lixo, '🗑️')}`,
              `-# O único bot do usuário <@${idInfo}> foi removido do sistema.`,
              deletedSquare
                ? `-# Também foi excluída da SquareCloud.`
                : `-# ${getEmoji(emojis.negative, '❌')} Não foi possível excluir da SquareCloud.`
            ].join('\n\n'))
        ]
      });
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`# Informe um App-ID válido ou um ID de usuário do Discord. ${getEmoji(emojis.negative, '❌')}`)
      ]
    });
  }
};