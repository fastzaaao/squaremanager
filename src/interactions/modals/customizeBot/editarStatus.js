const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: /^edit_status_modal_/,
  async execute(interaction) {
    const selectedStatusKey = interaction.customId.split('_').pop(); 
    const newStatus = interaction.fields.getTextInputValue('new_status');
    const guildId = interaction.guild.id;

    const statusesFilePath = path.join(__dirname, '../../../data/statuses.json');

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

    let statusesData = {};
    if (fs.existsSync(statusesFilePath)) {
      try {
        const fileContent = fs.readFileSync(statusesFilePath, 'utf8');
        statusesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo statuses.json:', error);
      }
    }

    if (!statusesData[guildId] || !statusesData[guildId][selectedStatusKey]) {
      return interaction.reply({
        content: 'O status selecionado não existe mais. Por favor, tente novamente.',
        flags: 64,
      });
    }

    statusesData[guildId][selectedStatusKey] = newStatus;

    try {
      fs.writeFileSync(statusesFilePath, JSON.stringify(statusesData, null, 2), 'utf8');

      const successEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`# Status Atualizado com Sucesso! ✅\nO status **${selectedStatusKey}** foi atualizado para:\n\n**${newStatus}**.`);

      await interaction.reply({
        embeds: [successEmbed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao salvar o status no arquivo JSON:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Ocorreu um erro ao tentar salvar o novo status. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};