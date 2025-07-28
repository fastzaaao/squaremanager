const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: /^definir_msg_(.+)$/,
  async execute(interaction) {
    const permissoesPath = path.join(__dirname, '../../../data/permissoes.json');
            let permissoesData = {};
            if (fs.existsSync(permissoesPath)) {
              try {
                const fileContent = fs.readFileSync(permissoesPath, 'utf8');
                permissoesData = JSON.parse(fileContent || '{}');
              } catch (error) {
                console.error('Erro ao ler permissoes.json:', error);
              }
            }
            const guildId = interaction.guild.id;
            const usersPermitidos = permissoesData[guildId]?.users || [];
            const isOwner = interaction.user.id === config.ownerId;
            const isPermitido = usersPermitidos.includes(interaction.user.id);
        
            if (!isOwner && !isPermitido) {
              const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('Você não tem permissão para interagir com este botão.');
        
              return interaction.reply({
                embeds: [embed],
                flags: 64,
              });
            }
    const customId = interaction.customId;
    const produto = customId.replace(/^definir_msg_/, '').replace(/_\d+$/, '');

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

    const explicacaoEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Definir Mensagem ${getEmoji(emojis.lapis, '✏️')}`,
        '-# Edite abaixo o conteúdo da embed do produto.',
        '-# Abaixo está a visualização atual da embed.',
        '-# Use os botões para personalizar cada campo.'
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const produtoEmbed = new EmbedBuilder()
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setTitle(app.preco?.embed?.titulo || 'Título não definido')
      .setDescription(app.preco?.embed?.desc || 'Descrição não definida')
      .setImage(app.banner || null);

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
        .setLabel('Preview (VÍDEO)')
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

    await interaction.reply({
      embeds: [explicacaoEmbed, produtoEmbed],
      components,
      flags: 64
    });
  },
};