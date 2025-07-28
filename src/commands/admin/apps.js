const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-apps')
    .setDescription('Configurar os apps/produtos do bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), 
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

    const colorPath = path.join(__dirname, '../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Configuração de Apps/Produtos ${getEmoji(emojis.caixa, '📦')}`,
        '-# Utilize os botões abaixo para adicionar, editar ou remover apps/produtos do bot.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const addButton = new ButtonBuilder()
      .setCustomId(`add_app_${interaction.user.id}`)
      .setLabel('Adicionar App')
      .setEmoji(getEmoji(emojis.plus, '➕'))
      .setStyle(ButtonStyle.Success);

    const removeButton = new ButtonBuilder()
      .setCustomId(`remove_app_${interaction.user.id}`)
      .setLabel('Remover App')
      .setEmoji(getEmoji(emojis.lixo, '🗑️'))
      .setStyle(ButtonStyle.Danger);

    const listarButton = new ButtonBuilder()
      .setCustomId(`listar_apps_${interaction.user.id}`)
      .setLabel('Listar Apps')
      .setEmoji(getEmoji(emojis.lista, '📋'))
      .setStyle(ButtonStyle.Secondary);

    const gerenciaButton = new ButtonBuilder()
      .setCustomId(`gerenciar_apps_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(addButton, removeButton, listarButton, gerenciaButton);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};