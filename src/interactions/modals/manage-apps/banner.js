const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  customId: /^modal_banner_(.+)_\d+$/,
  async execute(interaction) {
    const customId = interaction.customId;
    const produto = customId.replace(/^modal_banner_/, '').replace(/_\d+$/, '');
    const novoBanner = interaction.fields.getTextInputValue('novo_banner').trim();

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
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# App não encontrado ${getEmoji(emojis.caixa, '📦')}`,
              `-# Não existe um app/produto cadastrado com o nome **${produto}**.`
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ]
      });
    }

    if (!isValidUrl(novoBanner)) {
      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Banner inválido ${getEmoji(emojis.imagem, '🖼️')}`,
              '-# Informe uma URL válida para o banner.'
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ]
      });
    }

    app.banner = novoBanner;
    produtosData[produto] = app;
    fs.writeFileSync(produtosPath, JSON.stringify(produtosData, null, 2), 'utf8');

    const produtoEmbed = new EmbedBuilder()
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setTitle(app.preco?.embed?.titulo || 'Título não definido')
      .setDescription(app.preco?.embed?.desc || 'Descrição não definida')
      .setImage(novoBanner);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`personalizar_titulo_${produto}_${interaction.user.id}`)
        .setLabel('Personalizar Título')
        .setEmoji(getEmoji(emojis.lapis, '✏️'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`personalizar_desc_${produto}_${interaction.user.id}`)
        .setLabel('Personalizar Descrição')
        .setEmoji(getEmoji(emojis.lapis, '✏️'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`personalizar_cor_${produto}_${interaction.user.id}`)
        .setLabel('Personalizar Cor')
        .setEmoji(getEmoji(emojis.cor, '🎨'))
        .setStyle(ButtonStyle.Secondary),
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`personalizar_banner_${produto}_${interaction.user.id}`)
        .setLabel('Personalizar Banner')
        .setEmoji(getEmoji(emojis.imagem, '🖼️'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`preview_${produto}_${interaction.user.id}`)
        .setLabel('Tutorial/Preview')
        .setEmoji(getEmoji(emojis.youtube, '👁️'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`modo_msg_${produto}_${interaction.user.id}`)
        .setLabel('Modo da Mensagem')
        .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),
    );

    let components = [row, row2];
    if (app.preview) {
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Tutorial/Preview')
          .setStyle(ButtonStyle.Link)
          .setEmoji(getEmoji(emojis.youtube, '👁️'))
          .setURL(app.preview)
      );
      components.push(row3);
    }

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Banner atualizado ${getEmoji(emojis.imagem, '🖼️')}`,
            `-# O banner da embed do produto **${produto}** foi alterado para:`,
            `> ${novoBanner}`
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true })),
        produtoEmbed
      ],
      components
    });
  },
}