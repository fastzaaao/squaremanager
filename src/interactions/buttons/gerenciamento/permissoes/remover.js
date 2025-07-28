const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../../utils/getEmoji');
const config = require('../../../../config/config');

module.exports = {
  customId: 'remove_permission_user',
  async execute(interaction) {
    const client = interaction.client;
    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    const emojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));

    if (interaction.user.id !== config.ownerId) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription('Apenas o proprietário do bot pode interagir com este botão.');

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const colorPath = path.join(__dirname, '../../../../data/color.json');
    let colorData = {};
    if (fs.existsSync(colorPath)) {
      try {
        const fileContent = fs.readFileSync(colorPath, 'utf8');
        colorData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler color.json:', error);
      }
    }
    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const permissoesPath = path.join(__dirname, '../../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler permissoes.json:', error);
      }
    }

    const users = permissoesData[guildId]?.users || [];

    if (users.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription(`# Remover Permissão ${getEmoji(emojis.menos, '➖')}\n-# Nenhum usuário com permissão para remover.`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      return interaction.reply({
        embeds: [embed],
        flags: 64,
      });
    }

    const limitedUsers = users.slice(0, 25);

    const options = [];
    for (const id of limitedUsers) {
      let username = `ID: ${id}`;
      try {
        const user = await client.users.fetch(id).catch(() => null);
        if (user) username = user.username;
      } catch {}
      options.push({
        label: username,
        description: `ID: ${id}`,
        value: id,
        emoji: getEmoji(emojis.usuario, '👤'),
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
  .setCustomId(`remove_permission_user_select_${interaction.user.id}_${interaction.message.id}`) 
  .setPlaceholder('Selecione o usuário para remover')
  .addOptions(options)
  .setMinValues(1)
  .setMaxValues(options.length);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Remover Permissão ${getEmoji(emojis.menos, '➖')}`,
        '',
        '-# Selecione abaixo o usuário que deseja remover da lista de permissões.'
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: 64,
    });
  },
}