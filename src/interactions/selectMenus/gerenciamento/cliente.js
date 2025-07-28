const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: /^select_cliente_role_\d+_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        emojis = {};
      }
    }

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
        colorData = {};
      }
    }
    const embedColor = colorData[guildId] || '#808080';

    const roleId = interaction.values[0];

    const configPath = path.join(__dirname, '../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }
    configData.cliente = roleId;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${emojis.erro || '❌'} Erro ao salvar o cargo de cliente.`)
        ],
        flags: 64,
      });
    }

    const customIdParts = interaction.customId.split('_');
    const messageId = customIdParts[4];

    const channel = interaction.channel;
    const originalMessage = await channel.messages.fetch(messageId);

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Cargo definido com sucesso ${getEmoji(emojis.cargo, '🛡️')}`,
        `-# Cargo de cliente foi definido para <@&${roleId}> com sucesso!`,
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_logs`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle('Secondary');

    const row = new ActionRowBuilder().addComponents(backButton);

    await originalMessage.edit({
      embeds: [embed],
      components: [row],
    });
  },
}