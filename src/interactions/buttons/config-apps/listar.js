const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^listar_apps_\d+$/,
  async execute(interaction) {
    const produtosPath = path.join(__dirname, '../../../data/produtos.json');
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

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

    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }

    const nomes = Object.keys(produtosData);
    let desc;
    if (nomes.length === 0) {
      desc = `-# Nenhum app/produto cadastrado ainda.`;
    } else {
      desc = nomes.map(nome => {
        const app = produtosData[nome];
        return [
          `> ${getEmoji(emojis.caixa, '📦')} **${nome}**`,
          app.principal ? `> ${getEmoji(emojis.pontobranco, '⚪')} Principal: \`${app.principal}\`` : '',
          app.criadoPor ? `> ${getEmoji(emojis.pontobranco, '⚪')} Criado por: <@${app.criadoPor}>` : '',
          ''
        ].filter(Boolean).join('\n');
      }).join('\n\n');
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription(`# Lista de Apps/Produtos ${getEmoji(emojis.lista, '📋')}\n` + desc)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({
      embeds: [embed],
      flags: 64
    });
  },
}