const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^confirmar_pagamento_pix_(.+)_\d+$/,
  async execute(interaction) {
    const produto = interaction.customId.replace(/^confirmar_pagamento_pix_/, '').replace(/_\d+$/, '');
    const user = interaction.user;
    const configPath = path.join(__dirname, '../../../data/config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const aprovadorRoleId = config.semi?.aprovador;

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

    if (!interaction.member.roles.cache.has(aprovadorRoleId)) {
      return interaction.reply({
        content: `${getEmoji(emojis.negative, '❌')} Você não tem permissão para confirmar este pagamento. Apenas aprovadores podem usar este botão.`,
        flags: 64
      });
    }

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
        .setCustomId(`autenticar_bot_${produto}_${user.id}`)
        .setLabel('Autenticar Bot')
        .setEmoji(getEmoji(emojis.certo, '✅'))
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`tutorial_${produto}_${user.id}`)
        .setLabel('Tutorial Token')
        .setEmoji(getEmoji(emojis.menos, '➖'))
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('Discord Devs')
        .setStyle(ButtonStyle.Link)
        .setEmoji(getEmoji(emojis.code, '💻'))
        .setURL('https://discord.com/developers/applications')
    );

    await interaction.reply({
      content: `# ${getEmoji(emojis.certo, '✅')} ${user}, seu pagamento foi confirmado! Escolha uma das opções abaixo:`,
      components: [row]
    });

    const confirmEmbed = new EmbedBuilder()
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setAuthor({
        name: 'Pagamento Confirmado',
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setDescription([
        `- O pagamento do produto foi confirmado com sucesso!`,
        `- Usuário: <@${user.id}>`,
        `- Data: <t:${Math.floor(Date.now() / 1000)}:f>`
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
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.channel.send({ embeds: [confirmEmbed] });

    try {
      const vendasChannelId = config.vendas;
      const vendasChannel = await interaction.guild.channels.fetch(vendasChannelId).catch(() => null);
      if (vendasChannel && vendasChannel.isTextBased()) {
        await vendasChannel.send({ embeds: [confirmEmbed] });
      }
    } catch {}

    const clienteRoleId = config.cliente;
    if (clienteRoleId) {
      try {
        const member = await interaction.guild.members.fetch(user.id);
        if (member && !member.roles.cache.has(clienteRoleId)) {
          await member.roles.add(clienteRoleId);
        }
      } catch {}
    }

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i =>
        i.customId === `tutorial_${produto}_${user.id}` &&
        i.user.id === user.id,
      time: 10 * 60 * 1000 
    });

    collector.on('collect', async i => {
      await i.reply({
        flags: 64,
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# ${getEmoji(emojis.code, '💻')} Tutorial: Como criar uma aplicação e obter o Token`,
              '1. Acesse o site [Discord Developer Portal](https://discord.com/developers/applications)',
              '2. Clique em "**New Application**" e escolha um nome.',
              '3. No menu lateral, clique em "**Bot**" e depois em "**Add Bot**".',
              '4. Clique em "**Reset Token**" e depois em "**Copy**" para copiar seu token.',
            ].join('\n'))
        ]
      });
    });
  }
};