const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manage-apps')
    .setDescription('Configurar um app/produto existente')
    .addStringOption(option =>
      option
        .setName('produto')
        .setDescription('Selecione o produto para configurar')
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
          name: 'Crie um app primeiro!',
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

    if (produto === 'indisponivel') {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Nenhum app encontrado ${getEmoji(emojis.caixa, '📦')}`,
              '-# Use `/config-apps` para criar um app primeiro!'
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Edição do Produto ${getEmoji(emojis.caixa, '📦')}`,
        `-# Você está editando o produto **${produto}**.`,
        '-# Utilize os botões abaixo para definir a mensagem, valor ou fazer um commit.'
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const btnMsg = new ButtonBuilder()
      .setCustomId(`definir_msg_${produto}_${interaction.user.id}`)
      .setLabel('Definir Mensagem')
      .setEmoji(getEmoji(emojis.lapis, '✏️'))
      .setStyle(ButtonStyle.Secondary);

    const btnValor = new ButtonBuilder()
      .setCustomId(`definir_valor_${produto}_${interaction.user.id}`)
      .setLabel('Valor')
      .setEmoji(getEmoji(emojis.money, '💸'))
      .setStyle(ButtonStyle.Secondary);

    const btnCommit = new ButtonBuilder()
      .setCustomId(`commit_produto_${produto}_${interaction.user.id}`)
      .setLabel('Commit')
      .setEmoji(getEmoji(emojis.upload, '☁️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btnMsg, btnValor, btnCommit);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
}