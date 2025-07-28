const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { SquareCloudAPI } = require('@squarecloud/api');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const getEmoji = require('../utils/getEmoji');

const applicationsPath = path.join(__dirname, '../data/applications.json');
const autoPath = path.join(__dirname, '../data/auto.json');
const apisPath = path.join(__dirname, '../data/apis.json');
const configPath = path.join(__dirname, '../data/config.json');

function getSquareApiKey() {
  if (fs.existsSync(apisPath)) {
    try {
      const apis = JSON.parse(fs.readFileSync(apisPath, 'utf8'));
      return apis.square;
    } catch {}
  }
  return null;
}

function getLogsChannelId() {
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.logs;
    } catch {}
  }
  return null;
}

async function getSnapshot(appId, apiKey) {
  try {
    const url = `https://api.squarecloud.app/v2/apps/${appId}/snapshots`;
    const response = await axios.post(url, undefined, {
      headers: { Authorization: apiKey }
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

async function enviarLogsRemocao({ appId, owner, produto, nomeApp, botId, client, embedColor, backupPath, logsChannelId }) {
  try {
    if (!client || !logsChannelId) return;
    const logsChannel = await client.channels.fetch(logsChannelId).catch(() => null);
    if (!logsChannel || !logsChannel.isTextBased()) return;

    const emojisPath = path.join(__dirname, '../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {}
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

    const files = backupPath && fs.existsSync(backupPath)
      ? [new AttachmentBuilder(backupPath)]
      : [];

    await logsChannel.send({
      embeds: [embed],
      files
    });
  } catch (err) {
    console.error('Erro ao enviar log de remoção:', err?.message || err);
  }
}

async function avisarRemocao(userId, nomeApp, produto, client, embedColor = '#808080') {
  try {
    const emojisPath = path.join(__dirname, '../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {}
    }

    const user = await client.users.fetch(userId);
    if (user) {
      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          `# Aplicação excluída permanentemente ${getEmoji(emojis.lixo, '🗑️')}`,
          `-# Seu bot **${nomeApp}** foi excluído permanentemente por não ter sido renovado em até 3 dias após o vencimento.`
        ].join('\n'))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }));

      await user.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(`Erro ao enviar DM de remoção para ${userId}:`, err?.message || err);
  }
}

async function removerAplicacoesExpiradas() {
  if (!fs.existsSync(applicationsPath)) return;
  let applicationsData = {};
  try {
    applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
  } catch {
    return;
  }

  let autoData = {};
  if (fs.existsSync(autoPath)) {
    try {
      autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
    } catch {
      autoData = {};
    }
  }

  const apiKey = getSquareApiKey();
  if (!apiKey) return;
  const logsChannelId = getLogsChannelId();

  let embedColor = '#808080';
  const colorPath = path.join(__dirname, '../data/color.json');
  let colorData = {};
  if (fs.existsSync(colorPath)) {
    try {
      const fileContent = fs.readFileSync(colorPath, 'utf8');
      colorData = fileContent ? JSON.parse(fileContent) : {};
    } catch {
      colorData = {};
    }
  }
  const colorValues = Object.values(colorData);
  if (colorValues.length > 0) embedColor = colorValues[0];

  const now = Date.now();
  let alterou = false;

  for (const appId in applicationsData) {
    const app = applicationsData[appId];
    if (!app.expirado || !app.dataExpiracao) continue;

    const expira = new Date(app.dataExpiracao).getTime();
    if (now - expira >= 3 * 24 * 60 * 60 * 1000) {
      let backupPath = null;
      try {
        const snapshotUrl = await getSnapshot(appId, apiKey);
        if (snapshotUrl) {
          const response = await axios.get(snapshotUrl, { responseType: 'arraybuffer' });
          const buffer = Buffer.from(response.data, 'binary');
          const backupsDir = path.join(__dirname, '../source/backups');
          if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
          const nomeAppSanitizado = (app.nomeApp || 'app').replace(/[^\w\-]/g, '_');
          const agora = new Date();
          agora.setHours(agora.getHours() - 3); 
          const dataStr = agora.toISOString().replace(/[:T]/g, '-').slice(0, 19);
          backupPath = path.join(backupsDir, `${nomeAppSanitizado}_${dataStr}.zip`);
          fs.writeFileSync(backupPath, buffer);
        }
      } catch (err) {
        console.error('Erro ao baixar snapshot:', err?.response?.data || err);
      }

      try {
        const api = new SquareCloudAPI(apiKey);
        const application = await api.applications.get(appId);
        await application.delete();
      } catch (err) {
        console.error(`Erro ao remover aplicação ${appId} da SquareCloud:`, err?.message || err);
      }

      if (typeof global.client !== 'undefined' && logsChannelId) {
        await enviarLogsRemocao({
          appId,
          owner: app.owner,
          produto: app.produto,
          nomeApp: app.nomeApp,
          botId: app.botId,
          client: global.client,
          embedColor,
          backupPath,
          logsChannelId
        });
      }

      if (typeof global.client !== 'undefined' && app.owner) {
        await avisarRemocao(app.owner, app.nomeApp, app.produto, global.client, embedColor);
      }

      delete applicationsData[appId];
      if (app.owner && autoData[app.owner] && Array.isArray(autoData[app.owner].bots)) {
        autoData[app.owner].bots = autoData[app.owner].bots.filter(b => b.squareAppId !== appId);
      }

      if (app.arquivo) {
        const clientZipPath = path.join(__dirname, '../source', app.arquivo);
        if (fs.existsSync(clientZipPath)) {
          try {
            fs.unlinkSync(clientZipPath);
        } catch (err) {
              console.error(`Erro ao excluir zip do cliente: ${clientZipPath}`, err?.message || err);
          }
        }
      }

      alterou = true;
    }
  }

  if (alterou) {
    fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
    fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
  }
}

module.exports = { removerAplicacoesExpiradas };