const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'change_name_modal',
  async execute(interaction) {
    const newName = interaction.fields.getTextInputValue('bot_name');

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

    if (newName.length > 32) {
      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(
          'O nome fornecido excede o limite de 32 caracteres. Por favor, insira um nome mais curto.'
        );

      return interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }

    try {
      await interaction.client.user.setUsername(newName);

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`# Nome Alterado com Sucesso! ✅\nO meu nome foi atualizado para **${newName}**.`);

      await interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao alterar o nome do bot:', error);

      if (error.code === 50035 || error.message.includes('USERNAME_RATE_LIMIT')) {
        const rateLimitEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setDescription(
            'Você está tentando alterar o meu nome com muita frequência. Por favor, aguarde um pouco antes de tentar novamente.'
          );

        return interaction.reply({
          embeds: [rateLimitEmbed],
          flags: 64,
        });
      }

      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Ocorreu um erro ao tentar alterar o nome do bot. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};