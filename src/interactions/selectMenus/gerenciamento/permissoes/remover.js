const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const config = require('../../../../config/config');
const getEmoji = require('../../../../utils/getEmoji');

module.exports = {
  customId: 'remove_permission_user_select',
  async execute(interaction) {
    const client = interaction.client;

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

    const emojisPath = path.join(__dirname, '../../../../utils/emojisCache.json');
    let emojis = {};
    if (fs.existsSync(emojisPath)) {
      try {
        const fileContent = fs.readFileSync(emojisPath, 'utf8');
        emojis = JSON.parse(fileContent || '{}');
      } catch (error) {
        console.error('Erro ao ler emojisCache.json:', error);
      }
    }

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
    if (!permissoesData[guildId]) permissoesData[guildId] = { users: [] };

    const selected = interaction.values;
    let removed = [];
    let notFound = [];

    selected.forEach(id => {
      const idx = permissoesData[guildId].users.indexOf(id);
      if (idx !== -1) {
        permissoesData[guildId].users.splice(idx, 1);
        removed.push(id);
      } else {
        notFound.push(id);
      }
    });

    try {
      fs.writeFileSync(permissoesPath, JSON.stringify(permissoesData, null, 2), 'utf8');
    } catch (error) {
      console.error('Erro ao salvar permissoes.json:', error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`Erro ao salvar permissões.`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        ],
        flags: 64,
      });
    }

    let desc = '';
    if (removed.length > 0) {
      desc += `-# **Usuário(s) removido(s):**\n${removed.map(id => `<@${id}>`).join('\n')}\n\n`;
    }
    if (notFound.length > 0) {
      desc += `**IDs não encontrados na lista:**\n${notFound.map(id => `\`${id}\``).join('\n')}`;
    }
    if (!desc) desc = '-# Nenhum usuário foi removido.';

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setDescription([
        `# Gerenciamento de Permissões ${getEmoji(emojis.chave, '🔑')}`,
        '',
        desc
      ].join('\n'))
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

    await interaction.update({ embeds: [embed], components: [] });

    try {
      const customIdParts = interaction.customId.split('_');
      const mainMessageId = customIdParts[customIdParts.length - 1];
      const mainMessage = await interaction.channel.messages.fetch(mainMessageId);

      const usersList = permissoesData[guildId].users.length > 0
        ? permissoesData[guildId].users.map(id => `<@${id}>`).join('\n')
        : '*Nenhum usuário com permissão configurado.*';

      const mainEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setDescription([
          '# Gerenciamento de Permissões 🔒',
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

      await mainMessage.edit({
        embeds: [mainEmbed],
        components: [row1],
      });
    } catch (error) {
      console.error('Erro ao editar a mensagem principal de permissões:', error);
    }
  },
};