const { EmbedBuilder, ActionRowBuilder, RoleSelectMenuBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const getEmoji = require('../../../../../../utils/getEmoji');
const config = require('../../../../../../config/config');

module.exports = {
  customId: /^definir_cargo_aprovador_\d+$/,
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

    const userId = interaction.customId.split('_')[3];
    const permissoesPath = path.join(__dirname, '../../../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        permissoesData = {};
      }
    }
    const guildId = interaction.guild.id;
    const usersPermitidos = permissoesData[guildId]?.users || [];
    const isOwner = interaction.user.id === config.ownerId;
    const isPermitido = usersPermitidos.includes(interaction.user.id);

    if (!isOwner && !isPermitido) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Você não tem permissão para interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
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
    const embedColor = colorData[guildId] || '#808080';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Selecione o Cargo de Aprovador ${getEmoji(emojis.cargo, '🛡️')}`,
        '-# Escolha abaixo o cargo que será responsável por aprovar pagamentos.',
        '',
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const selectMenu = new RoleSelectMenuBuilder()
      .setCustomId(`select_aprovador_${interaction.user.id}_${interaction.message.id}`)
      .setPlaceholder('Selecione o cargo de aprovador')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
    });
  },
}