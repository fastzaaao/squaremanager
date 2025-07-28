const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  customId: 'back_panel',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    const userId = interaction.customId.split('_')[2];

    if (interaction.user.id !== userId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const ping = interaction.client.ws.ping;
    const uptimeTimestamp = Math.floor((Date.now() - interaction.client.uptime) / 1000);

    const filePath = path.join(__dirname, '../../data/color.json');

    let colorData = {};
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo color.json:', error);
      }
    }

    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        '# Olá, **' + interaction.user.username + '**! 👋',
        '-# Este é o painel de **gerenciamento do seu bot**.',
        '-# Utilize os botões abaixo para configurar **funções** e **preferências** de acordo com o **seu servidor**.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: `${getEmoji(emojis.staff, '👮‍♂️')} Versão`, value: '1.0.0', inline: true },
        { name: `${getEmoji(emojis.robo, '🤖')} Ping`, value: `${ping} ms`, inline: true },
        { name: `${getEmoji(emojis.foguete, '🚀')} Uptime`, value: `<t:${uptimeTimestamp}:R>`, inline: true }
      );

    const personalize = new ButtonBuilder()
      .setCustomId(`customize_bot_${interaction.user.id}`)
      .setLabel('Personalizar Bot')
      .setEmoji(getEmoji(emojis.custom, '🛠️'))
      .setStyle(ButtonStyle.Success);

    const manager = new ButtonBuilder()
      .setCustomId(`painel_manager_${interaction.user.id}`)
      .setLabel('Sistema de Gerenciamento')
      .setEmoji(getEmoji(emojis.escudo, '👨‍💼'))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(personalize, manager);

    await interaction.update({
      embeds: [embed],
      components: [row1],
    });
  },
}