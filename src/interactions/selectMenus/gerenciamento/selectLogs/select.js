const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const getEmoji = require('../../../../utils/getEmoji');

module.exports = {
  customId: /^select_channel_(logs|vendas|renovacoes|backup)_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        emojis = {};
      }
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
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    const tipo = interaction.customId.split('_')[2];

    const configPath = path.join(__dirname, '../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        configData = JSON.parse(fileContent || '{}');
      } catch (error) {
        configData = {};
      }
    }

    configData[tipo] = channelId;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o canal selecionado.`)
        ],
        flags: 64,
      });
    }

    const titulos = {
      logs: 'Logs Gerais',
      vendas: 'Logs Vendas',
      renovacoes: 'Logs Renovações',
      backup: 'Logs Backup',
    };

    const emojiTipo = {
      logs: getEmoji(emojis.escudo, '🛡️'),
      vendas: getEmoji(emojis.cart, '🛒'),
      renovacoes: getEmoji(emojis.money, '💸'),
      backup: getEmoji(emojis.backup, '💾'),
    };

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Canal de ${titulos[tipo]} ${emojiTipo[tipo] || ''} configurado com sucesso!`,
        `-# Canal selecionado: <#${channelId}> (${channel?.name || 'Desconhecido'})`
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const backButton = new ButtonBuilder()
      .setCustomId(`manager_logs`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const rowBack = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({
      embeds: [embed],
      components: [rowBack],
    });
  },
}