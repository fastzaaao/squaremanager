const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../utils/getEmoji');

const applicationsPath = path.join(__dirname, '../data/applications.json');
const colorPath = path.join(__dirname, '../data/color.json');
const avisosPath = path.join(__dirname, '../data/avisos_pre_expiracao.json');

function getEmbedColor(guildId) {
  let colorData = {};
  if (fs.existsSync(colorPath)) {
    try {
      colorData = JSON.parse(fs.readFileSync(colorPath, 'utf8'));
    } catch {}
  }
  return colorData[guildId] || '#808080';
}

function getNowInBrasilia() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

async function avisarPreExpiracao(userId, nomeApp, produto, diasRestantes, client, embedColor = '#808080') {
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
          `# Sua mensalidade está prestes a expirar ${getEmoji(emojis.data, '📅')}`,
          `-# O bot **${nomeApp}** irá expirar em **${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}**.`,
          '-# Renove antes do vencimento para evitar interrupção do serviço.',
          '-# Use `/apps` para renovar sua aplicação.'
        ].join('\n'))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }));

      await user.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error(`Erro ao enviar aviso pré-expiração para ${userId}:`, err?.message || err);
  }
}

async function avisarPreExpiracoes(client) {
  if (!fs.existsSync(applicationsPath)) return;
  let applicationsData = {};
  try {
    applicationsData = JSON.parse(fs.readFileSync(applicationsPath, 'utf8'));
  } catch {
    return;
  }

  let avisosData = {};
  if (fs.existsSync(avisosPath)) {
    try {
      avisosData = JSON.parse(fs.readFileSync(avisosPath, 'utf8'));
    } catch {
      avisosData = {};
    }
  }

  const nowBR = getNowInBrasilia().getTime();

  for (const appId in applicationsData) {
    const app = applicationsData[appId];
    if (!app.dataExpiracao || app.expirado) continue;

    const expira = new Date(app.dataExpiracao).getTime();
    const diff = expira - nowBR;
    const diasRestantes = Math.ceil(diff / (24 * 60 * 60 * 1000));

    if (diasRestantes <= 3 && diasRestantes > 0) {
      avisosData[appId] = avisosData[appId] || {};
      if (!avisosData[appId][diasRestantes]) {
        await avisarPreExpiracao(
          app.owner,
          app.nomeApp,
          app.produto,
          diasRestantes,
          client,
          getEmbedColor(app.guildId)
        );
        avisosData[appId][diasRestantes] = true;
      }
    }
    if (diasRestantes > 3 && avisosData[appId]) {
      delete avisosData[appId];
    }
  }

  fs.writeFileSync(avisosPath, JSON.stringify(avisosData, null, 2));
}

module.exports = { avisarPreExpiracoes };