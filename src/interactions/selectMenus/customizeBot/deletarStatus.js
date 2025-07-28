const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: /^delete_status_select_/,
  async execute(interaction) {
    const selectedStatusKey = interaction.values[0];
    const userId = interaction.customId.split('_')[3];
    const guildId = interaction.guild.id;

    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: 'Você não tem permissão para interagir com este menu.',
        flags: 64,
      });
    }

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

    delete statusesData[guildId][selectedStatusKey];

    const reorderedStatuses = {};
    const remainingStatuses = Object.values(statusesData[guildId]);
    remainingStatuses.forEach((status, index) => {
      reorderedStatuses[`status${index + 1}`] = status; 
    });

    statusesData[guildId] = reorderedStatuses; 

    try {
      fs.writeFileSync(statusesFilePath, JSON.stringify(statusesData, null, 2), 'utf8');

      const successEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`# Status Deletado com Sucesso! ❌\nO status foi removido com sucesso.`);

      await interaction.reply({
        embeds: [successEmbed],
        flags: 64,
      });
    } catch (error) {
      console.error('Erro ao salvar o arquivo statuses.json:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription('Ocorreu um erro ao tentar deletar o status. Tente novamente mais tarde.');

      await interaction.reply({
        embeds: [errorEmbed],
        flags: 64,
      });
    }
  },
};