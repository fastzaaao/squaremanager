const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'change_banner_modal',
  async execute(interaction) {
    const bannerUrl = interaction.fields.getTextInputValue('banner_url');

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

    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))(?:\?.*)?$/i;
    if (!urlRegex.test(bannerUrl)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(
          'O link fornecido não é válido. Certifique-se de que é um link direto para uma imagem com uma das seguintes extensões: **png, jpg, jpeg, gif, webp**.'
        );

      return interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }

    try {
      await interaction.client.user.setBanner(bannerUrl);

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('# Banner Alterado com Sucesso! ✅\nO meu banner foi atualizado com a imagem fornecida.')
        .setThumbnail(bannerUrl);

      await interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao alterar o banner do bot:', error);

      if (error.code === 50035 || error.message.includes('BANNER_RATE_LIMIT')) {
        const rateLimitEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setDescription(
            'Você está tentando trocar o meu banner com muita frequência. Por favor, aguarde um pouco antes de tentar novamente.'
          );

        return interaction.reply({
          embeds: [rateLimitEmbed],
          flags: 64,
        });
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Ocorreu um erro ao tentar alterar o banner do bot. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};