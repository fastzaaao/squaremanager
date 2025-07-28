const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

function isValidValor(valor) {
  return /^(\d+|\d+\.\d{1,2})$/.test(valor);
}

module.exports = {
  customId: /^modal_valor_(.+)_\d+$/,
  async execute(interaction) {
    const customId = interaction.customId;
    const produto = customId.replace(/^modal_valor_/, '').replace(/_\d+$/, '');
    const novoValor = interaction.fields.getTextInputValue('novo_valor').trim();

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

    const produtosPath = path.join(__dirname, '../../../data/produtos.json');
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
    if (!app) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# App não encontrado ${getEmoji(emojis.caixa, '📦')}`,
              `-# Não existe um app/produto cadastrado com o nome **${produto}**.`
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    if (!isValidValor(novoValor)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Valor inválido ${getEmoji(emojis.money, '💸')}`,
              '-# Informe apenas números inteiros ou com ponto. Exemplo: `19` ou `19.90`.'
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    app.preco.mensal.preco = novoValor;
    app.preco.mensal.onoff = true;
    produtosData[produto] = app;
    fs.writeFileSync(produtosPath, JSON.stringify(produtosData, null, 2), 'utf8');

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Valor atualizado ${getEmoji(emojis.money, '💸')}`,
            `-# O valor mensal do produto **${produto}** foi alterado para:`,
            `> \`R$ ${novoValor}\``
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      flags: 64
    });
  },
}