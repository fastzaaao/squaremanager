const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  customId: /^modal_tempo_pagar_\d+$/,
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

    const tempoStr = interaction.fields.getTextInputValue('tempo_pagar_input');
    const tempo = Number(tempoStr);

    if (isNaN(tempo) || tempo < 5 || tempo > 59) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`O tempo deve ser um número entre 5 e 59 minutos.`)
        ],
        flags: 64,
      });
    }

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
    configData.semi.tempoPay = tempo;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch (error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar o tempo de pagamento.`)
        ],
        flags: 64,
      });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Tempo para Pagar ${emojis.cooldown || '⏰'}`,
            `-# Tempo definido como **${tempo} minutos** com sucesso!`
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ],
      flags: 64,
    });
  },
}