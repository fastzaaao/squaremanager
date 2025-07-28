const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enviar-msg')
    .setDescription('Envia o painel de compra do produto')
    .addStringOption(option =>
      option
        .setName('produto')
        .setDescription('Selecione o produto para enviar')
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    const produtosPath = path.join(__dirname, '../../data/produtos.json');
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }
    const choices = Object.keys(produtosData);
    if (choices.length === 0) {
      await interaction.respond([
        {
          name: 'Nenhum produto disponível',
          value: 'indisponivel',
        }
      ]);
      return;
    }
    const focusedValue = interaction.options.getFocused();
    const filtered = choices.filter(choice =>
      choice.toLowerCase().includes(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25)
    );
  },
  async execute(interaction) {
    const produto = interaction.options.getString('produto');

    const produtosPath = path.join(__dirname, '../../data/produtos.json');
    let produtosData = {};
    if (fs.existsSync(produtosPath)) {
      try {
        const fileContent = fs.readFileSync(produtosPath, 'utf8');
        produtosData = fileContent ? JSON.parse(fileContent) : {};
      } catch {
        produtosData = {};
      }
    }

    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

    const colorPath = path.join(__dirname, '../../data/color.json');
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

    if (produto === 'indisponivel' || !produtosData[produto]) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Produto não encontrado ${getEmoji(emojis.caixa, '📦')}\n-# Não existe um produto cadastrado com esse nome.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const app = produtosData[produto];

    if (!app.preco || !app.preco.mensal || !app.preco.mensal.preco) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Produto sem preço ${getEmoji(emojis.money, '💸')}\n-# Configure o preço do produto antes de enviar o painel.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const sourceDir = path.join(__dirname, '../../source');
    const zipPath = path.join(sourceDir, app.arquivo || `${produto}.zip`);
    if (!fs.existsSync(zipPath)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Arquivo não encontrado ${getEmoji(emojis.caixa, '📦')}\n-# O arquivo .zip do produto não foi encontrado na pasta source.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    if (
      !app.preco.embed ||
      typeof app.preco.embed.titulo !== 'string' ||
      typeof app.preco.embed.desc !== 'string' ||
      typeof app.preco.embed.cor !== 'string'
    ) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Produto com configuração inválida ${getEmoji(emojis.caixa, '📦')}\n-# O JSON do produto está incompleto ou inválido.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const produtoEmbed = new EmbedBuilder()
      .setColor(app.preco?.embed?.cor === 'Default' ? embedColor : app.preco.embed.cor)
      .setTitle(app.preco?.embed?.titulo || 'Título não definido')
      .setDescription(app.preco?.embed?.desc || 'Descrição não definida')
      .setImage(app.banner || null);

    const btnComprar = new ButtonBuilder()
      .setCustomId(`comprar_${produto}_${interaction.user.id}`)
      .setLabel('Comprar')
      .setEmoji(getEmoji(emojis.cart, '💸'))
      .setStyle(ButtonStyle.Secondary);

    let row;
    if (app.preview) {
      const btnPreview = new ButtonBuilder()
        .setLabel('Tutorial/Preview')
        .setStyle(ButtonStyle.Link)
        .setEmoji(getEmoji(emojis.youtube, '👁️'))
        .setURL(app.preview);

      row = new ActionRowBuilder().addComponents(btnComprar, btnPreview);
    } else {
      row = new ActionRowBuilder().addComponents(btnComprar);
    }

    await interaction.reply({
      embeds: [produtoEmbed],
      components: [row]
    });
  },
}