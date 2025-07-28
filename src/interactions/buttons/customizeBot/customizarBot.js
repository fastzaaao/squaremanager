const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: 'customize_bot',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
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

    const filePath = path.join(__dirname, '../../../data/color.json');

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
        '# Personalização do Bot 🎨',
        '-# Nessa área você pode personalizar a **minha aparência** de acordo com o seu servidor.',
        '-# Utilize os botões abaixo para navegar entre as opções de **personalização**.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const changeAvatarButton = new ButtonBuilder()
      .setCustomId(`change_avatar_${userId}`)
      .setLabel('Alterar Avatar do Bot')
      .setEmoji(getEmoji(emojis.imagem, '🖼️'))
      .setStyle(ButtonStyle.Secondary);

    const changeBannerButton = new ButtonBuilder()
      .setCustomId(`change_banner_${userId}`)
      .setLabel('Alterar Banner do Bot')
      .setEmoji(getEmoji(emojis.imagem, '🖼️'))
      .setStyle(ButtonStyle.Secondary);

    const changeNameButton = new ButtonBuilder()
      .setCustomId(`change_name_${userId}`)
      .setLabel('Alterar Nome do Bot')
      .setEmoji(getEmoji(emojis.lupa, '🔍'))
      .setStyle(ButtonStyle.Secondary);

    const changeColorButton = new ButtonBuilder()
      .setCustomId(`change_color_${userId}`)
      .setLabel('Alterar Cor das Embeds')
      .setEmoji(getEmoji(emojis.cor, '🎨'))
      .setStyle(ButtonStyle.Secondary);

    const changeStatusButton = new ButtonBuilder()
      .setCustomId(`change_status_${userId}`)
      .setLabel('Alterar Status do Bot')
      .setEmoji(getEmoji(emojis.folha, '📄'))
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId(`back_panel_${userId}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(changeAvatarButton, changeBannerButton, changeNameButton);
    const row2 = new ActionRowBuilder().addComponents(changeColorButton, changeStatusButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row1, row2],
    });
  },
}