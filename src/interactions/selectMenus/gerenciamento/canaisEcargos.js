const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: 'select_channel_type',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

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
        .setDescription('Você não tem permissão para interagir com este menu.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler color.json:', error);
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const selected = interaction.values[0];

    const tipos = {
      logs: {
        titulo: 'Selecione o canal de logs gerais',
        emoji: getEmoji(emojis.escudo, '🛡️'),
        channelTypes: [0], 
      },
      vendas: {
        titulo: 'Selecione o canal de logs vendas',
        emoji: getEmoji(emojis.cart, '🛒'),
        channelTypes: [0],
      },
      renovacoes: {
        titulo: 'Selecione o canal de logs renovações',
        emoji: getEmoji(emojis.money, '💸'),
        channelTypes: [0],
      },
      backup: {
        titulo: 'Selecione o canal de logs backup',
        emoji: getEmoji(emojis.backup, '💾'),
        channelTypes: [0],
      },
    };

    const tipo = tipos[selected];

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# ${tipo.titulo} ${tipo.emoji}`,
        '-# Selecione abaixo o canal desejado para esta função.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const selectChannel = new ChannelSelectMenuBuilder()
      .setCustomId(`select_channel_${selected}_${interaction.user.id}`)
      .setPlaceholder(tipo.titulo)
      .setMinValues(1)
      .setMaxValues(1)
      .setChannelTypes(...tipo.channelTypes);

    const rowChannel = new ActionRowBuilder().addComponents(selectChannel);

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_logs`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const rowBack = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({
      embeds: [embed],
      components: [rowChannel, rowBack],
    });
  },
}