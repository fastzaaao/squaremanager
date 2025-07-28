const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: /^manager_definicoes_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

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

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        colorData = {};
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Definições Gerais ${getEmoji(emojis.engrenagem, '⚙️')}`,
        '-# Configure integrações e métodos de pagamento do seu bot.',
        '-# Utilize os botões abaixo para acessar as opções:',
        '',
        `> ${getEmoji(emojis.money, '💰')} **Formas de Pagamento**`,
        `> ${getEmoji(emojis.squarecloud, '🟦')} **SquareCloud**`,
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const pagamentoButton = new ButtonBuilder()
      .setCustomId(`manager_pagamento_${interaction.user.id}`)
      .setLabel('Formas de Pagamento')
      .setEmoji(getEmoji(emojis.money, '💰'))
      .setStyle(ButtonStyle.Secondary);

    const squareButton = new ButtonBuilder()
      .setCustomId(`manager_squarecloud_${interaction.user.id}`)
      .setLabel('SquareCloud')
      .setEmoji(getEmoji(emojis.squarecloud, '🟦'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`painel_manager_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(pagamentoButton, squareButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
}