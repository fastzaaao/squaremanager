const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const getEmoji = require('../../../utils/getEmoji');
const config = require('../../../config/config');

module.exports = {
  customId: 'manager_permissions',
  async execute(interaction) {
    const emojisPath = path.join(__dirname, '../../../utils/emojisCache.json');
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

    const permissoesPath = path.join(__dirname, '../../../data/permissoes.json');
    let permissoesData = {};
    if (fs.existsSync(permissoesPath)) {
      try {
        const fileContent = fs.readFileSync(permissoesPath, 'utf8');
        permissoesData = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler o arquivo permissoes.json:', error);
      }
    }

    const guildId = interaction.guild.id;
    const embedColor = colorData[guildId] || '#808080';

    const users = permissoesData[guildId]?.users || [];
    let usersList;
    if (users.length > 0) {
      usersList = users.map(id => `<@${id}>`).join('\n');
    } else {
      usersList = '*Nenhum usuário com permissão configurado.*';
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Gerenciamento de Permissões ${getEmoji(emojis.chave, '🔑')}\n`,
        '-# Aqui você pode definir quem pode acessar comandos e sistemas do bot.',
        '-# Use os botões abaixo para adicionar ou remover permissões de cargos ou usuários.',
        '',
        `**Usuários com permissão:**\n${usersList}`,
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    const addUserButton = new ButtonBuilder()
      .setCustomId(`add_permission_user_${interaction.user.id}`)
      .setLabel('Adicionar Usuário')
      .setEmoji(getEmoji(emojis.plus, '➕'))
      .setStyle(ButtonStyle.Success);

    const removeUserButton = new ButtonBuilder()
      .setCustomId(`remove_permission_user_${interaction.user.id}`)
      .setLabel('Remover Usuário')
      .setEmoji(getEmoji(emojis.menos, '➖'))
      .setStyle(ButtonStyle.Danger);

    const backButton = new ButtonBuilder()
      .setCustomId(`painel_manager_${interaction.user.id}`)
      .setEmoji(getEmoji(emojis.seta, '⬅️'))
      .setStyle(ButtonStyle.Secondary);

    const row1 = new ActionRowBuilder().addComponents(addUserButton, removeUserButton, backButton);

    await interaction.update({
      embeds: [embed],
      components: [row1],
    });
  },
}