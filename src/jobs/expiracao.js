const fs = require('fs');
const path = require('path');
const { SquareCloudAPI } = require('@squarecloud/api');
const getEmoji = require('../utils/getEmoji');
const { EmbedBuilder } = require('discord.js');

const applicationsPath = path.join(__dirname, '../data/applications.json');
const apisPath = path.join(__dirname, '../data/apis.json');
const configPath = path.join(__dirname, '../data/config.json');
const colorPath = path.join(__dirname, '../data/color.json');
const avisosPath = path.join(__dirname, '../data/avisos_pre_expiracao.json');

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

async function desligarBot(appId, apiKey) {
  try {
    const api = new SquareCloudAPI(apiKey);
    const app = await api.applications.get(appId);
    await app.stop();
    return true;
  } catch (err) {
    if (err?.message?.includes('Container Already Stopped')) {
      return false;
    } else {
      console.error(`Erro ao desligar bot ${appId}:`, err?.message || err);
      return false;
    }
  }
}

async function avisarUsuario(userId, nomeApp, produto, client, embedColor = '#808080') {
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
          `# Sua mensalidade expirou ${getEmoji(emojis.data, '📅')}`,
          `-# A mensalidade do seu bot **${nomeApp}** expirou, portanto ele foi desligado.`,
          '-# Você tem até **3 dias** para renovar sua mensalidade antes que a aplicação seja **permanentemente excluída**.',
          '-# Para renovar, acesse o painel de controle da sua aplicação utilizando o comando `/apps`.',
        ].join('\n'))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }));

      await user.send({ embeds: [embed] });
    } else {
    }
  } catch (err) {
    console.error(`Erro ao enviar DM para ${userId}:`, err?.message || err);
  }
}

async function logDiscord({ userId, nomeApp, produto, appId, botId, dataExpiracao, logsChannelId, client, embedColor = '#808080' }) {
  if (!logsChannelId || !client) return;
  try {
    const emojisPath = path.join(__dirname, '../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {}
    }

    const channel = await client.channels.fetch(logsChannelId);
    if (!channel || !channel.isTextBased()) return;

    const user = await client.users.fetch(userId);

    const dataObj = new Date(dataExpiracao);
    dataObj.setHours(dataObj.getHours() + 3);
    const dataFormatada = dataObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Mensalidade expirada ${getEmoji(emojis.data, '📅')}`,
        `-# Usuário: <@${userId}> (\`${userId}\`)`,
        `-# Produto: \`${produto}\``,
        `-# Nome do App: \`${nomeApp}\``,
        `-# Bot ID: \`${botId}\``,
        `-# App-ID: \`${appId}\``,
        `-# Expirou em: \`${dataFormatada}\``,
        `-# Data: <t:${Math.floor(Date.now() / 1000)}:f>`
      ].join('\n'))
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Erro ao enviar log no Discord:', err?.message || err);
  }
}

async function verificarExpiracoes(client = null) {
  if (!fs.existsSync(applicationsPath)) return;
  let applicationsData = {};
  try {
    applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
  } catch {
    return;
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
  let embedColor = '#808080';
  const colorValues = Object.values(colorData);
  if (colorValues.length > 0) embedColor = colorValues[0];

  const apiKey = getSquareApiKey();
  if (!apiKey) return;
  const logsChannelId = getLogsChannelId();

  function getNowInBrasilia() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

const nowBR = getNowInBrasilia().getTime();
for (const appId in applicationsData) {
  const app = applicationsData[appId];
  if (!app.dataExpiracao) continue;
  const expira = new Date(app.dataExpiracao).getTime();
  if (expira < nowBR && !app.expirado) {
    applicationsData[appId].expirado = true;
    await desligarBot(appId, apiKey);

    if (fs.existsSync(avisosPath)) {
      try {
        const avisosData = JSON.parse(fs.readFileSync(avisosPath, 'utf8'));
        if (avisosData[appId]) {
          delete avisosData[appId];
          fs.writeFileSync(avisosPath, JSON.stringify(avisosData, null, 2));
        }
      } catch {}
    }
    
    if (client) {
      await avisarUsuario(app.owner, app.nomeApp, app.produto, client, embedColor);
      await logDiscord({
        userId: app.owner,
        nomeApp: app.nomeApp,
        produto: app.produto,
        appId,
        botId: app.botId,
        dataExpiracao: app.dataExpiracao,
        logsChannelId,
        client,
        embedColor
      });
    }
  }
}
fs.writeFileSync(applicationsPath, JSON.stringify(applicationsData, null, 2));
}

module.exports = { verificarExpiracoes };