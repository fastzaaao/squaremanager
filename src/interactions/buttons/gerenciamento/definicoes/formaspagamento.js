const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../../utils/getEmoji');
const config = require('../../../../config/config');

module.exports = {
  customId: /^manager_pagamento_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    const permissoesPath = path.join(__dirname, '../../../../data/permissoes.json');
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

    const colorPath = path.join(__dirname, '../../../../data/color.json');
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
        `# Formas de Pagamento ${getEmoji(emojis.money, '💰')}`,
        '-# Escolha abaixo o método de pagamento que deseja configurar:',
        '',
        `> ${getEmoji(emojis.mercadopago, '🟦')} **Mercado Pago**`,
        `> ${getEmoji(emojis.pix, '⚡')} **Semi-Automático**`,
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const mercadoPagoButton = new ButtonBuilder()
      .setCustomId(`manager_mercadopago_${interaction.user.id}`)
      .setLabel('Mercado Pago')
      .setEmoji(getEmoji(emojis.mercadopago, '🟦'))
      .setStyle(ButtonStyle.Secondary);

    const semiAutomaticoButton = new ButtonBuilder()
      .setCustomId(`manager_semiautomatico_${interaction.user.id}`)
      .setLabel('Semi-Automático')
      .setEmoji(getEmoji(emojis.pix, '💠'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_definicoes_${interaction.user.id}`)
      .setLabel('Voltar')
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(mercadoPagoButton, semiAutomaticoButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
}