const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'change_color_modal',
  async execute(interaction) {
    const colorCode = interaction.fields.getTextInputValue('embed_color');
    const guildId = interaction.guild.id;

    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(colorCode)) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(
          'O código fornecido não é válido. Certifique-se de usar o formato **#RRGGBB**.'
        );

      return interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }

    const filePath = path.join(__dirname, '../../../data/color.json');

    try {
      let colorData = {};
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      }

      colorData[guildId] = colorCode;

      fs.writeFileSync(filePath, JSON.stringify(colorData, null, 2), 'utf8');

      const successEmbed = new EmbedBuilder()
        .setColor(colorCode)
        .setDescription(`# Cor Alterada com Sucesso! ✅\nA nova cor das embeds foi definida como **${colorCode}**.`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      await interaction.reply({
        embeds: [successEmbed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao salvar a cor no arquivo JSON:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Ocorreu um erro ao tentar salvar a nova cor. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};