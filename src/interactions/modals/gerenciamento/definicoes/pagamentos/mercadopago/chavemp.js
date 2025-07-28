const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

async function validarChaveMP(chave) {
  try {
    const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
      headers: { Authorization: `Bearer ${chave}` }
    });
    return response.status === 200 && Array.isArray(response.data);
  } catch (error) {
    if (error.response && [401, 403].includes(error.response.status)) return false;
    return false;
  }
}

module.exports = {
  customId: /^modal_definir_chave_mp_\d+$/,
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        colorData = JSON.parse(fs.readFileSync(colorPath, 'utf8'));
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const chave = interaction.fields.getTextInputValue('chave_mp_input').trim();

    await interaction.deferReply({ flags: 64 });
    if (!(await validarChaveMP(chave))) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('A chave Mercado Pago fornecida não é válida ou não foi aceita pela API.')
        ]
      });
    }

    const configPath = path.join(__dirname, '../../../../../../data/config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try {
        configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        configData = {};
      }
    }
    if (!configData.mercadopago) configData.mercadopago = {};
    configData.mercadopago.chave = chave;

    try {
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
    } catch {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('Erro ao salvar a chave Mercado Pago.')
        ]
      });
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setDescription([
            `# Definições Mercado Pago ${emojis.engrenagem || '⚙️'}`,
            '-# Chave Mercado Pago definida com sucesso!',
            '',
          ].join('\n'))
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      ]
    });
  },
};