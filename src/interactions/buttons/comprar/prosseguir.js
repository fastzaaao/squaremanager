const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');
const path = require('path');
const fs = require('fs');

module.exports = {
  customId: /^prosseguir_pagamento_(.+)_\d+$/,
  async execute(interaction) {
    const produto = interaction.customId.replace(/^prosseguir_pagamento_/, '').replace(/_\d+$/, '');
    const user = interaction.user;

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

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

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pagamento_mercadopago_${produto}_${user.id}`)
        .setLabel('Mercado Pago')
        .setEmoji(getEmoji(emojis.mercadopago, '💳'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`pagamento_pix_${produto}_${user.id}`)
        .setLabel('Pix')
        .setEmoji(getEmoji(emojis.pix, '💠'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`sair_carrinho_${produto}_${user.id}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({
      content: `Qual opção de pagamento você deseja utilizar?`,
      embeds: [],
      components: [row]
    });
  },
}