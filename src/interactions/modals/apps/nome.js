const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const getEmoji = require('../../../utils/getEmoji');

module.exports = {
  customId: /^modal_nome_(.+)_(\d+)$/,
  async execute(interaction) {
    const match = interaction.customId.match(/^modal_nome_(.+)_(\d+)$/);
    if (!match) return;

    const squareAppId = match[1];
    const ownerId = match[2];

    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild?.id;
    const embedColor = colorData[guildId] || '#808080';

    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Você não tem permissão para alterar esta aplicação. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    const novoNome = interaction.fields.getTextInputValue('novo_nome').trim();

    if (novoNome.length < 2 || novoNome.length > 32) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# O nome deve ter entre 2 e 32 caracteres. ${getEmoji(emojis.negative, '❌')} `)
        ],
        flags: 64
      });
    }

    const autoPath = path.join(__dirname, '../../../data/auto.json');
    let autoData = {};
    if (fs.existsSync(autoPath)) {
      try {
        autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      } catch {
        autoData = {};
      }
    }

    const userBots = autoData[ownerId]?.bots || [];
    const bot = userBots.find(b => b.squareAppId === squareAppId);

    if (!bot) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Aplicação não encontrada.${getEmoji(emojis.negative, '❌')} `)
        ],
        flags: 64
      });
    }

    bot.nomeApp = novoNome;

    try {
      fs.writeFileSync(autoPath, JSON.stringify(autoData, null, 2));
    } catch (e) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`# Erro ao salvar as informações. ${getEmoji(emojis.negative, '❌')}`)
        ],
        flags: 64
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(embedColor)
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setDescription([
            `# Nome alterado com sucesso ${getEmoji(emojis.lapis, '✏️')}`,
            `-# O nome da aplicação foi atualizado para: \`${novoNome}\``
          ].join('\n\n'))
      ],
      flags: 64
    });
  }
};