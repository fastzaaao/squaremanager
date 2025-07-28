const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { QrCodePix } = require('qrcode-pix');
const { createCanvas } = require('canvas');
const QRCode = require('qrcode');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^pagamento_pix_(.+)_\d+$/,
  async execute(interaction) {
    const produto = interaction.customId.replace(/^pagamento_pix_/, '').replace(/_\d+$/, '');
    const user = interaction.user;

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

    const configPath = path.join(__dirname, '../../../data/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    let chavePix = config.semi?.chave || 'chave não configurada';
    const tipoPix = config.semi?.tipo || 'Tipo não configurado';

    if (tipoPix.toLowerCase() === 'telefone' && !chavePix.startsWith('+')) {
      chavePix = `+${chavePix}`;
    }

    const valorPix = Number(app.preco.mensal.preco);
    const qrCodePix = QrCodePix({
      version: '01',
      key: chavePix,
      name: 'Fast',
      city: 'BRASILIA',
      cep: '70000000',
      value: valorPix,
      message: `Pagamento do produto ${app.nome}`
    });

    const payloadPix = qrCodePix.payload();
    const canvas = createCanvas(400, 400);
    await QRCode.toCanvas(canvas, payloadPix, {
      width: 400,
      margin: 1
    });
    const buffer = canvas.toBuffer('image/png');
    const attachment = new AttachmentBuilder(buffer, { name: "payment.png" });

    const tempoPay = typeof config.semi?.tempoPay === 'number' && config.semi.tempoPay > 0 ? config.semi.tempoPay : 10;
    let agora = new Date();
    agora.setMinutes(agora.getMinutes() + tempoPay);
    const time = Math.floor(agora.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Pagamento via Pix`, iconURL: user.displayAvatarURL() })
      .addFields(
        { name: `${getEmoji(emojis.relogioo, '⏰')} Pagamento vai expirar:`, value: `<t:${time}:R>`, inline: true },
        { name: `${getEmoji(emojis.pix, '💠')} Chave Pix:`, value: `\`${chavePix} | ${tipoPix}\``, inline: false },
        { name: 'Produto', value: `\`\`\`${app.nome}\`\`\``, inline: true },
        { name: 'Valor Mensal', value: `\`\`\`R$ ${valorPix}\`\`\``, inline: true }
      )
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setImage('attachment://payment.png')
      .setFooter({ text: 'Após o pagamento, envie o comprovante para que possamos confirmar a ativação do seu plano.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copyPix_${produto}_${user.id}`)
        .setLabel(`Copia & Cola`)
        .setEmoji(getEmoji(emojis.pix, '💠'))
        .setStyle(1),
      new ButtonBuilder()
        .setCustomId(`confirmar_pagamento_pix_${produto}_${user.id}`)
        .setLabel('Confirmar Pagamento')
        .setEmoji(getEmoji(emojis.certo, '✅'))
        .setStyle(3),
      new ButtonBuilder()
        .setCustomId(`sair_carrinho_${produto}_${user.id}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(2)
    );

    await interaction.update({
      content: `<@${user.id}>`,
      embeds: [embed],
      components: [row],
      files: [attachment]
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i =>
        i.customId === `copyPix_${produto}_${user.id}` &&
        i.user.id === user.id,
      time: tempoPay * 60 * 1000
    });

    collector.on('collect', async i => {
      await i.reply({
        content: `${payloadPix}`,
        flags: 64
      });
    });
  }
};