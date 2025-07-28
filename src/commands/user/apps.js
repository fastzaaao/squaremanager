const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../utils/getEmoji');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apps')
    .setDescription('Gerencie suas aplicações autenticadas.'),
  async execute(interaction) {
    const autoPath = path.join(__dirname, '../../data/auto.json');
    let autoData = {};
    if (fs.existsSync(autoPath)) {
      try {
        autoData = JSON.parse(fs.readFileSync(autoPath, 'utf8'));
      } catch {
        autoData = {};
      }
    }

    const emojisPath = path.join(__dirname, '../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
      } catch {
        emojis = {};
      }
    }

    const colorPath = path.join(__dirname, '../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch {
        colorData = {};
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const userId = interaction.user.id;
    const userApps = autoData[userId]?.bots || [];

    if (!userApps.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(embedColor)
            .setDescription([
              `# Nenhuma aplicação encontrada ${getEmoji(emojis.caixa, '📦')}`,
              '-# Alugue um bot para usar este comando!'
            ].join('\n'))
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId(`apps_select_${interaction.user.id}`)
      .setPlaceholder('Selecione uma aplicação para gerenciar');

    userApps.forEach(bot => {
      select.addOptions({
        label: `${bot.nomeApp} - ${bot.squareAppId}`,
        description: bot.produto,
        value: bot.squareAppId || bot.nomeApp,
        emoji: `${getEmoji(emojis.robo, '🤖')}`,
      });
    });

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Gerenciar Aplicações ${getEmoji(emojis.caixa, '📦')}`,
        `-# Selecione no menu abaixo qual aplicação você deseja gerenciar`,
      ].join('\n\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(select)],
      flags: 64
    });
  }
};