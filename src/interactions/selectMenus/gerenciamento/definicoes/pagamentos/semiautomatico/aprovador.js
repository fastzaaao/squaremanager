const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../../../../utils/getEmoji');

module.exports = {
  customId: /^select_aprovador_\d+_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        emojis = {};
      }
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
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const roleId = interaction.values[0];

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
    if (!configData.semi) configData.semi = {};
    configData.semi.aprovador = roleId;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o cargo de aprovador.`)
        ],
        flags: 64,
      });
    }

    const chavePix = configData.semi.chave || 'Não definida';
    const aprovador = `<@&${roleId}>`;

    const customIdParts = interaction.customId.split('_');
    const messageId = customIdParts[3];

    const channel = interaction.channel;
    const originalMessage = await channel.messages.fetch(messageId);

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Definições Semi-Automático ${getEmoji(emojis.engrenagem, '⚙️')}`,
        '-# Configure abaixo a chave PIX e o cargo de aprovador para o sistema semi-automático.',
        '',
      ].join('\n'))
      .addFields(
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Chave PIX`,
          value: `\`${chavePix}\``,
          inline: true,
        },
        {
          name: `${getEmoji(emojis.pontobranco, '⚪')} Cargo de Aprovador`,
          value: aprovador,
          inline: true,
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await originalMessage.edit({
      embeds: [embed],
      components: originalMessage.components,
    });

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription(`# Cargo definido com sucesso ${getEmoji(emojis.cargo, '🛡️')}\n-# Cargo de aprovador foi definido para <@&${roleId}> com sucesso!`)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      components: [],
      flags: 64,
    });
  },
}