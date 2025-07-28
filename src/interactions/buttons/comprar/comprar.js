const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const path = require('path');
const fs = require('fs');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^comprar_(.+)_\d+$/,
  async execute(interaction) {
    const produto = interaction.customId.replace(/^comprar_/, '').replace(/_\d+$/, '');
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
    if (!app) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Produto não encontrado ${getEmoji(emojis.caixa, '📦')}\n-# Não existe um produto cadastrado com esse nome.`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const threadName = `🛒・${user.username}`;

    const existingThread = interaction.channel.threads.cache.find(
  t => t.name === threadName && !t.archived
);

if (existingThread) {
  return interaction.reply({
    content: `# ${getEmoji(emojis.cart, '🛒')} Você já possui um carrinho aberto em <#${existingThread.id}>`,
    flags: 64
  });
}
    const thread = await interaction.channel.threads.create({
      name: threadName,
      autoArchiveDuration: 60,
      reason: `Compra iniciada por ${user.tag}`,
      type: 12 
    });
    await thread.members.add(user.id);

    const compraEmbed = new EmbedBuilder()
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setAuthor({
        name: 'Compra de Produto',
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setDescription([
        `- Para prosseguir, clique no botão abaixo.`,
        ''
      ].join('\n'))
      .addFields(
          {
            name: 'Produto',
            value: `\`\`\`${app.nome}\`\`\``,
            inline: true
          },
          {
            name: 'Valor Mensal',
            value: `\`\`\`R$ ${app.preco.mensal.preco}\`\`\``,
            inline: true
          }
        )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setImage(app.banner || null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`prosseguir_pagamento_${produto}_${user.id}`)
        .setLabel('Prosseguir para o Pagamento')
        .setEmoji(`${getEmoji(emojis.certo, '✅')}`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`sair_carrinho_${produto}_${user.id}`)
        .setEmoji(getEmoji(emojis.porta, '⬅️'))
        .setStyle(ButtonStyle.Secondary)
    );

    await thread.send({
      content: `<@${user.id}>`,
      embeds: [compraEmbed],
      components: [row]
    });

    const linkButton = new ButtonBuilder()
      .setLabel('Ir para a compra')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`)

    await interaction.reply({
      content: `# ${getEmoji(emojis.cart, '🛒')} Carrinho criado com sucesso!`,
      components: [
        new ActionRowBuilder().addComponents(linkButton)
      ],
      flags: 64
    });
  },
}