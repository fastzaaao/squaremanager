const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'define_status_modal',
  async execute(interaction) {
    const statusesInput = interaction.fields.getTextInputValue('bot_statuses');
    const guildId = interaction.guild.id;

    const colorFilePath = path.join(__dirname, '../../../data/color.json');

    let colorData = {};
    if (fs.existsSync(colorFilePath)) {
      try {
        const fileContent = fs.readFileSync(colorFilePath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo color.json:', error);
      }
    }

    const embedColor = colorData[guildId] || '#808080'; 

    const statuses = statusesInput.split('|').map(status => status.trim()).filter(Boolean);

    if (statuses.length > 5) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você pode definir no máximo 5 status. Por favor, tente novamente.');

      return interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }

    const filePath = path.join(__dirname, '../../../data/statuses.json');

    let statusesData = {};
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        statusesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo statuses.json:', error);
      }
    }

    statusesData[guildId] = {};
    statuses.forEach((status, index) => {
      statusesData[guildId][`status${index + 1}`] = status;
    });

    try {
      fs.writeFileSync(filePath, JSON.stringify(statusesData, null, 2), 'utf8');

      const successEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`# Status Atualizados com Sucesso! ✅\nOs novos status foram salvos com sucesso, sendo eles:\n\n${statuses.map((status, index) => `**Status ${index + 1}:** ${status}`).join('\n')}`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))

      await interaction.reply({
        embeds: [successEmbed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao salvar os status no arquivo JSON:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Ocorreu um erro ao tentar salvar os novos status. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};