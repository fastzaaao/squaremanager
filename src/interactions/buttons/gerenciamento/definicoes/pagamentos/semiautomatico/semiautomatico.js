const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../../../../utils/getEmoji');
const config = require('../../../../../../config/config');

module.exports = {
  customId: /^manager_semiautomatico_\d+$/,
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

    const configPath = path.join(__dirname, '../../../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }
    const semiAtivo = configData.semi?.sistema === true;
    const tempoPay = configData.semi?.tempoPay;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Semi-Automático ${getEmoji(emojis.pix, '💠')}`,
        '-# Este sistema é ideal para quem não utiliza o Mercado Pago. Ele exige uma aprovação manual dos pagamentos realizados para aluguéis de apps. Para configurar, basta definir o Tempo de Pagamento, a Chave de Autenticação PIX, e o Cargo de Aprovador.',
        '',
      ].join('\n'))
      .addFields(
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Status`,
          value: semiAtivo
            ? `\`🟢 Ligado\``
            : `\`🔴 Desligado\``,  
          inline: true,
        },
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Tempo para Pagar` ,
          value: tempoPay ? `\`${tempoPay} minutos\`` : '\`Não definido\`',
          inline: true,
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const toggleButton = new ButtonBuilder()
      .setCustomId(`toggle_semiautomatico_${interaction.user.id}`)
      .setEmoji(semiAtivo ? getEmoji(emojis.on, '🟢') : getEmoji(emojis.off, '🔴'))
      .setStyle(semiAtivo ? ButtonStyle.Success : ButtonStyle.Danger);

    const tempoButton = new ButtonBuilder()
      .setCustomId(`tempo_pagar_${interaction.user.id}`)
      .setLabel('Tempo para Pagar')
      .setEmoji(getEmoji(emojis.cooldown, '⏰'))
      .setStyle(ButtonStyle.Secondary);

    const definicoesButton = new ButtonBuilder()
      .setCustomId(`definicoes_semiautomatico_${interaction.user.id}`)
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
}