const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getEmoji = require('../../../../../../utils/getEmoji');

module.exports = {
  customId: /^toggle_semiautomatico_\d+$/,
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
    if (!configData.semi) configData.semi = {};
    configData.semi.sistema = !configData.semi.sistema;

    try {
      fs.writeFileSync(configJsonPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o estado do sistema semi-automático.`)
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

    const semiAtivo = configData.semi.sistema === true;
    const tempoPay = configData.semi.tempoPay;

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Semi-Automático ${getEmoji(emojis.pix, '💠')}`,
        '-# Este sistema é ideal para quem não utiliza o Mercado Pago. Ele exige uma aprovação manual dos pagamentos realizados para aluguéis de apps. Para configurar, basta definir o Tempo de Pagamento, a Chave de Autenticação PIX, e o Cargo de Aprovador.',
        '',
      ].join('\n'))
      .addFields(
        {
          name: 'Status',
          value: semiAtivo
            ? `\`🟢 Ligado\``
            : `\`🔴 Desligado\``,
          inline: true,
        },
        {
          name: `${getEmoji(emojis.cooldown, '⏰')} Tempo para Pagar` ,
          value: tempoPay ? `\`${tempoPay} minutos\`` : '`Não definido`',
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