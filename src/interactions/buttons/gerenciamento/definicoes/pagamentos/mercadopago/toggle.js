const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../../../../utils/getEmoji');

module.exports = {
  customId: /^toggle_mercadopago_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    const permissoesPath = path.join(__dirname, '../../../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        permissoesData = {};
      }
    }
    const configPath = path.join(__dirname, '../../../../../../config/config.js');
    const config = require(configPath);
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

    const configJsonPath = path.join(__dirname, '../../../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configJsonPath)) {
      try {
        const fileContent = fs.readFileSync(configJsonPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }
    if (!configData.mercadopago) configData.mercadopago = {};
    configData.mercadopago.sistema = !configData.mercadopago.sistema;

    try {
      fs.writeFileSync(configJsonPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o estado do sistema Mercado Pago.`)
        ],
        flags: 64,
      });
    }

    const colorPath = path.join(__dirname, '../../../../../../data/color.json');
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

    const mpAtivo = configData.mercadopago.sistema === true;
    const chaveMP = configData.mercadopago.chave || null;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Mercado Pago ${getEmoji(emojis.mercadopago, '🟦')}`,
        '-# Sistema automático de pagamentos via Mercado Pago. Ao receber o pagamento, o bot libera o aluguel automaticamente.',
        '',
      ].join('\n'))
      .addFields(
        {
          name: 'Status',
          value: mpAtivo
            ? `\`🟢 Ligado\``
            : `\`🔴 Desligado\``,
          inline: true,
        },
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Chave de Integração`,
          value: chaveMP ? `\`${chaveMP}\`` : '`Não definida`',
          inline: true,
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const toggleButton = new ButtonBuilder()
      .setCustomId(`toggle_mercadopago_${interaction.user.id}`)
      .setEmoji(mpAtivo ? getEmoji(emojis.on, '🟢') : getEmoji(emojis.off, '🔴'))
      .setStyle(mpAtivo ? ButtonStyle.Success : ButtonStyle.Danger);

     const tempoButton = new ButtonBuilder()
      .setCustomId(`tempo_pagar_${interaction.user.id}`)
      .setLabel('Tempo para Pagar')
      .setEmoji(getEmoji(emojis.cooldown, '⏰'))
      .setStyle(ButtonStyle.Secondary);

    const definicoesButton = new ButtonBuilder()
      .setCustomId(`definicoes_mercadopago_${interaction.user.id}`)
      .setLabel('Definições')
      .setEmoji(getEmoji(emojis.engrenagem, '⚙️'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_pagamento_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(toggleButton, tempoButton, definicoesButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row],
    });
  },
};
